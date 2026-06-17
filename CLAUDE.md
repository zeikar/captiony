# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server with Turbopack (http://localhost:3000)
npm run build    # Production build
npm run start    # Serve the production build
npm run lint     # ESLint via `next lint`
```

There is no test framework configured — verify changes by running the app.

## Environment

Auth and SEO read three env vars (see `.env.local.example`). Both Firebase configs are stored as a **single JSON string**, parsed at module load:

- `FIREBASE_ADMIN_SERVICE_ACCOUNT` — Admin SDK service account (server-only)
- `NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG` — Web SDK config (client)
- `NEXT_PUBLIC_BASE_URL` — public site URL for `sitemap.ts` / `robots.ts`

When a config is absent the parse yields `null` and Firebase init is skipped, so the editor still runs without auth configured.

## Architecture

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4. Path alias `@/*` maps to the repo root. The app is a single page (`app/page.tsx`): `NavBar` + `CaptionEditor`.

### State: two Zustand stores with different lifecycles

- **`lib/stores/subtitle-store.ts`** — subtitle data + timeline UI state. Persisted to `localStorage` under `captiony-subtitles`, but `partialize` saves **only `subtitles`** (selection/editing/timeline state is intentionally not persisted). Also owns SRT/VTT import/export and parsing (no external library). Seeded with demo subtitles.
- **`lib/stores/video-store.ts`** — playback state. **Not** persisted. Holds a `videoRef` to the actual `<video>` element; actions like `togglePlayPause`/`seekTo` imperatively drive the DOM element *and* mirror state. Keep this two-way coupling in mind — changing playback state usually means also calling the DOM element.

The subtitle store cross-reads the video store via `useVideoStore.getState()` (e.g. `getCurrentSubtitle` matches against `video.currentTime`), so the stores are coupled one-directionally.

### Firebase auth: dual SDK (client + Admin) with session cookies

> **Not yet wired into the UI.** This is complete scaffolding (carried over from a boilerplate) kept for a planned cloud/account feature — `AuthButtons`/`AuthModal`/`ServerAuthInfo` are not rendered by `NavBar` or any page, so no auth runs today. Treat it as roadmap code, not a live system, until it's mounted.

Authentication splits across the Web SDK (client) and Admin SDK (server):

1. Client signs in (Google popup or anonymous) via `lib/firebase/useFirebaseAuth.ts` → `lib/firebase/client.ts`.
2. Client gets the Firebase ID token and POSTs it to `app/api/auth/signin/route.ts`.
3. The route verifies the token with the Admin SDK (`lib/firebase/admin.ts`) and sets an httpOnly **session cookie** `firebase-session` (2-week expiry).
4. Server Components read the current user with `getServerUser()` in `lib/firebase/auth-server.ts`, which verifies the session cookie — this is the server-side source of truth.

`app/api/auth/` has `signin`, `signout`, and `user` (DELETE = account deletion). `useFirebaseAuth` also supports linking an anonymous account to Google (`linkWithGoogle`) and full account deletion (client + server). After auth changes it calls `router.refresh()` to re-fetch server-rendered user state.

### Notifications: React Context (not Zustand)

`contexts/notification-context.tsx` provides toast notifications via `useNotification()` (`addError/Info/Success/WarningNotification`). Firebase errors flow through `lib/utils/useFirebaseErrorHandler.ts` + `firebaseErrors.ts`, which translate Firebase error codes into these toasts. The provider is mounted in `app/layout.tsx` under `ThemeProvider`.

### Editor composition

`CaptionEditor` lays out `VideoPlayer` (left 2/3), `SubtitleEditor` (right 1/3), and `SubtitleTimeline` (bottom). The editor's logic lives in `components/editor/hooks/` (keyboard shortcuts, drag, timeline wheel/clicks/markers, video player) and `components/editor/utils/`; `components/editor/components/` holds the granular presentational pieces. `CaptionEditor` also registers the `beforeunload` warning.

### SEO

`lib/metadata.ts` centralizes `getMetadata`/`getViewport`/`getStructuredData`, consumed by `app/layout.tsx`. `app/sitemap.ts` and `app/robots.ts` derive from `NEXT_PUBLIC_BASE_URL`.

## Conventions

- Inline code comments are a mix of Korean and English — match the surrounding language when editing a given file.
- Subtitle times are stored as floating-point **seconds**; formatting/parsing to SRT (`,` ms separator) and VTT (`.` ms separator) is handled only in `subtitle-store.ts`.
