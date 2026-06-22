# Captiony

An intuitive and lightweight web-based subtitle editor. Load a local video file or a YouTube link and caption it right in the browser. Open-source, fast, and easy to use. 🎥✍️

![Captiony Screenshot](.github/screenshots/screenshot.png)

## Features

### Core Features

- **Two Video Sources** - Edit against a local video file (all major formats) or a YouTube link
- **Timeline-Based Editing** - Visual timeline with drag-and-drop subtitle manipulation
- **Real-time Preview** - See subtitles overlaid on the video as you edit
- **Undo/Redo** - Full history for subtitle edits (`Cmd/Ctrl + Z` / `+ Shift`)
- **Auto-Save** - Automatic localStorage persistence prevents data loss
- **Keyboard Shortcuts** - Professional editing workflow with comprehensive shortcuts
- **Dark Mode** - Beautiful dark/light theme support

### Subtitle Management

- **Add & Edit Subtitles** - Create and modify subtitle text with precise timing
- **Drag & Resize** - Adjust timing by dragging subtitle bars on the timeline
- **In/Out Points** - Set a subtitle's start (`I`) or end (`O`) to the current playback time
- **Split** - Split a subtitle at the playhead (`S`)
- **Timeline Modes**
  - Free mode: Navigate timeline freely
  - Centered mode: Playhead stays centered for easier editing
- **Import/Export**
  - Import: SRT, VTT formats
  - Export: SRT, VTT formats

### User Experience

- **Responsive Design** - Works seamlessly on desktop and tablet
- **Exit Protection** - Warns before leaving page to prevent accidental data loss
- **Timeline Zoom** - Zoom in/out for precise or overview editing
- **Visual Feedback** - Dimmed past timeline for better focus

## Demo

Try it live at: [captiony.vercel.app](https://captiony.vercel.app)

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository

```bash
git clone https://github.com/zeikar/captiony.git
cd captiony
```

2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Basic Workflow

1. **Load Video**: Pick a local video file (drag & drop or click) or paste a YouTube link from the empty-state picker. Use "Select Video" in the toolbar to switch sources later.
2. **Add Subtitles**: Press `N` (or `Cmd/Ctrl + Enter`) to add a subtitle at the current time
3. **Edit Timing**: Drag subtitle bars on the timeline, set In/Out points with `I`/`O`, or edit timestamps directly
4. **Edit Text**: Click on subtitle text to edit in the right panel
5. **Export**: Download your subtitles as SRT or VTT files

### Keyboard Shortcuts

**Playback**

- `Space` / `K` - Play/Pause
- `←` / `→` - Jump back / forward 5 seconds
- `J` / `L` - Jump back / forward 1 second

**Subtitles**

- `N` / `Cmd/Ctrl + Enter` - Add new subtitle at current time
- `↑` / `↓` - Select previous / next subtitle
- `M` - Jump to nearest subtitle
- `Enter` - Edit selected subtitle
- `Delete` / `Backspace` - Delete selected subtitle
- `Esc` - Deselect subtitle
- `I` / `O` - Set In / Out point to current time
- `S` - Split subtitle at current time
- `Shift + ←` / `Shift + →` - Nudge selected subtitle left / right (0.1s)

**History**

- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo

> Click **Shortcuts** in the toolbar for the full list in-app.

## Project Structure

```
app/                      - Next.js App Router pages
  page.tsx                - Main application page (NavBar + CaptionEditor)
  layout.tsx              - Root layout with theme + notification providers
  api/auth/               - Firebase session-cookie auth routes (scaffolding)
components/
  editor/                 - Subtitle editor
    CaptionEditor.tsx     - Main editor container (video + editor + timeline)
    VideoPlayer.tsx       - Video player with per-source surfaces
    SubtitleTimeline.tsx  - Timeline visualization
    SubtitleEditor.tsx    - Subtitle list + text editor panel
    ToolBar.tsx           - Import/export + source-switch toolbar
    components/           - Granular UI pieces
      LocalVideoSurface.tsx  - <video> surface (local files)
      YouTubeSurface.tsx     - react-player surface (YouTube)
      VideoUploader.tsx      - Empty-state picker (file | YouTube)
      SubtitleBar.tsx, TimelineGrid.tsx, TimelinePlayhead.tsx, ...
    hooks/                - Keyboard, drag, timeline, and player hooks
    utils/                - Time / subtitle / timeline / video helpers
  layout/NavBar.tsx       - Top navigation bar
  ui/                     - Reusable UI components (e.g. DarkModeToggle)
contexts/                 - React Context (toast notifications)
lib/
  stores/                 - Zustand state management
    subtitle-store.ts     - Subtitle data, SRT/VTT I/O, undo/redo (zundo)
    video-store.ts        - Playback state (local + YouTube sources)
  firebase/               - Web + Admin SDK auth helpers (scaffolding)
  metadata.ts             - SEO metadata configuration
public/                   - Static assets
```

## Technical Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand (localStorage persistence) + zundo (undo/redo)
- **Video Playback**: HTML5 `<video>` (local) + react-player 3.x (YouTube)
- **UI Components**: Headless UI, Heroicons, react-virtuoso (virtualized list)
- **File Handling**: FileSaver.js
- **Testing**: Vitest + React Testing Library
- **Analytics**: Vercel Analytics

## Key Features in Detail

### Auto-Save System

Subtitles are automatically saved to browser localStorage as you work. When you return to the app, your work is automatically restored, preventing data loss from accidental page closures or browser crashes.

### Timeline Editing

The timeline provides a visual representation of your subtitles over time. You can:
- Drag subtitle bars to change their position
- Resize bars by dragging edges to adjust duration
- Zoom in for frame-accurate editing
- Zoom out for an overview of your entire subtitle track

### Import/Export

- **Import**: Load existing SRT or VTT subtitle files to continue editing
- **Export**: Download your subtitles in industry-standard SRT or VTT formats compatible with YouTube, video players, and professional editing software

## Browser Compatibility

Captiony works best in modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Heroicons](https://heroicons.com/) - Beautiful icons

---

Built with ❤️ by [zeikar](https://github.com/zeikar)
