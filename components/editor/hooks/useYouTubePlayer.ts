import { useRef, useEffect, useCallback } from "react";
import { useVideoStore } from "@/lib/stores/video-store";
import { useNotification } from "@/contexts/notification-context";

const SYNC_THRESHOLD = 0.1; // only sync the player when drift exceeds 0.1s
// Our own RAF writes land the store value exactly, so anything farther than this
// from our last write is a genuine external seek (timeline/keyboard/progress bar).
const SELF_WRITE_EPSILON = 0.001;
const MAX_FRAME_DT = 0.1; // cap per-frame elapsed so a throttled tab can't fast-forward
const MAX_LEAD = 0.4; // never glide more than this far ahead of the real time
const GLIDE_RATE = 0.92; // bridge resume stalls just under 1x so real converges back

// YouTube playback path. youtube-video-element's `currentTime` getter is live
// (it calls YouTube's getCurrentTime() on every read), so a RAF loop tracks it
// for smooth playhead motion — the onTimeUpdate event alone fires only
// ~100–250ms apart, which made the playhead step. Note the `currentTime` setter
// triggers a real seekTo, so we must never write back an interpolated value.
//
// One wrinkle: right after resume, getCurrentTime() stalls (~200–300ms) then
// jumps to catch up, which reads as a teleport. So instead of echoing the raw
// time we keep a monotonic "displayed" time: track real time when it's ahead
// (steady playback == plain polling), and glide forward just under 1x when real
// has stalled. Displayed never moves backward, so the playhead can't jitter.
export function useYouTubePlayer() {
  const playerRef = useRef<HTMLVideoElement>(null);
  // Guards the external-seek effect and the RAF loop from acting mid-seek,
  // mirroring the same pattern used in useVideoPlayer for the local <video>.
  const isSeekingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  // Monotonic displayed time + the wall clock of the previous frame, and the
  // last value we pushed to the store (so the external-seek effect can tell our
  // own writes from real user seeks).
  const displayedRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastPushedRef = useRef(0);

  const {
    video,
    setCurrentTime,
    setCurrentTimeSmooth,
    setIsPlaying,
    setVideoDuration,
    setVideoRef,
    clearVideoRef,
    clearVideo,
  } = useVideoStore();

  // Capture at hook level — hooks can't be called inside event callbacks.
  const { addErrorNotification } = useNotification();

  // react-player's ref structurally satisfies MediaController, so register it
  // as-is. Only the active surface is mounted, so this is the sole YouTube ref.
  useEffect(() => {
    setVideoRef(playerRef);
    return () => clearVideoRef();
  }, [setVideoRef, clearVideoRef]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // RAF loop: advance a monotonic displayed time for smooth playhead motion.
  // Tracks the live currentTime when it's ahead; glides forward when YouTube's
  // getCurrentTime() stalls right after resume. Skips writes mid-seek.
  const updateCurrentTime = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      rafRef.current = null;
      return;
    }
    if (!isSeekingRef.current) {
      const now = performance.now();
      const dt = Math.min(MAX_FRAME_DT, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      const real = player.currentTime;
      const prev = displayedRef.current;

      let next: number;
      if (real > prev) {
        // Real time is ahead — track it directly (steady playback: same as
        // plain polling, so motion stays perfectly smooth).
        next = real;
      } else {
        // Real time is stalled at/behind us (the post-resume freeze). Glide
        // forward just under 1x to bridge the gap, bounded so a long buffer
        // stall can't run the playhead away from the actual video.
        next = Math.min(prev + dt * GLIDE_RATE, real + MAX_LEAD);
      }
      if (next < prev) next = prev; // never move backward → no jitter

      const duration = player.duration;
      if (Number.isFinite(duration) && duration > 0) {
        next = Math.min(next, duration);
      }

      displayedRef.current = next;
      lastPushedRef.current = next;
      setCurrentTimeSmooth(next);
    }
    rafRef.current = requestAnimationFrame(updateCurrentTime);
  }, [setCurrentTimeSmooth]);

  const startLoop = useCallback(() => {
    stopLoop();
    lastFrameRef.current = performance.now();
    const player = playerRef.current;
    // Reseed only when far out of sync (first play, or a seek while paused);
    // otherwise keep displayed continuous across pause→play.
    if (
      player &&
      Math.abs(displayedRef.current - player.currentTime) > MAX_LEAD
    ) {
      displayedRef.current = player.currentTime;
      lastPushedRef.current = player.currentTime;
    }
    rafRef.current = requestAnimationFrame(updateCurrentTime);
  }, [stopLoop, updateCurrentTime]);

  const onReady = useCallback(() => {
    const player = playerRef.current;
    // onDurationChange is the authoritative source; onReady is a best-effort
    // early read. Skip NaN/0 so we don't overwrite a valid duration with junk.
    if (player && Number.isFinite(player.duration) && player.duration > 0) {
      setVideoDuration(player.duration);
    }
  }, [setVideoDuration]);

  // Read playback values from the player ref, not the event: youtube-video-element
  // dispatches these media events with an object whose `currentTarget` is already
  // cleared, so `e.currentTarget` is undefined by the time the handler runs.
  const onDurationChange = useCallback(() => {
    const player = playerRef.current;
    if (player && Number.isFinite(player.duration) && player.duration > 0) {
      setVideoDuration(player.duration);
    }
  }, [setVideoDuration]);

  const onTimeUpdate = useCallback(() => {
    // While playing, the RAF loop owns smooth updates. This only covers
    // player-driven time changes when the loop isn't running (e.g. a paused
    // scrub before onPlay fires). Skip mid-seek to avoid echoing the seek back.
    if (isSeekingRef.current || rafRef.current !== null) return;
    const player = playerRef.current;
    if (player) {
      displayedRef.current = player.currentTime;
      lastPushedRef.current = player.currentTime;
      setCurrentTime(player.currentTime);
    }
  }, [setCurrentTime]);

  const onPlay = useCallback(() => {
    setIsPlaying(true);
    startLoop();
  }, [setIsPlaying, startLoop]);

  const onPause = useCallback(() => {
    setIsPlaying(false);
    stopLoop();
    // Snap the authoritative store time back to the real frame. The glide can
    // lead the real time during a resume stall, but `video.currentTime` is also
    // the editor's source of truth (active-subtitle matching, add/split/in-out),
    // so paused editing must use the exact frame, not a synthetic leading value.
    const player = playerRef.current;
    if (player) {
      displayedRef.current = player.currentTime;
      lastPushedRef.current = player.currentTime;
      setCurrentTime(player.currentTime);
    }
  }, [setIsPlaying, stopLoop, setCurrentTime]);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    stopLoop();
    const player = playerRef.current;
    if (player) {
      displayedRef.current = player.duration;
      lastPushedRef.current = player.duration;
      setCurrentTime(player.duration);
    }
  }, [setIsPlaying, stopLoop, setCurrentTime]);

  const onSeeked = useCallback(() => {
    isSeekingRef.current = false;
    const player = playerRef.current;
    if (!player) return;
    // A seek is a deliberate jump — reset the monotonic displayed time to the
    // landing position (this is the only place it may move backward).
    displayedRef.current = player.currentTime;
    lastPushedRef.current = player.currentTime;
    lastFrameRef.current = performance.now();
    setCurrentTime(player.currentTime);
  }, [setCurrentTime]);

  const onError = useCallback(() => {
    // The video can't be embedded (private, age/region-restricted, or embedding
    // disabled). Notify the user then return to the uploader so the UI doesn't hang.
    stopLoop();
    addErrorNotification(
      "This video can't be embedded — it may be private, age-restricted, region-restricted, or have embedding disabled."
    );
    clearVideo();
  }, [stopLoop, addErrorNotification, clearVideo]);

  // Cancel the RAF loop on unmount.
  useEffect(() => stopLoop, [stopLoop]);

  // Drive the player when currentTime changes externally (keyboard/timeline/
  // progress-bar seeks). The SELF_WRITE_EPSILON check skips our own RAF writes
  // (whose monotonic value can lead the real time) so they never trigger a
  // seekTo; isSeekingRef then prevents the seek from echoing back into the store.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !video.url) return;

    // Our own writes land the store value exactly — ignore them.
    if (Math.abs(video.currentTime - lastPushedRef.current) < SELF_WRITE_EPSILON) {
      return;
    }

    if (Math.abs(player.currentTime - video.currentTime) > SYNC_THRESHOLD) {
      isSeekingRef.current = true;
      displayedRef.current = video.currentTime;
      lastPushedRef.current = video.currentTime;
      player.currentTime = video.currentTime;
    }
  }, [video.currentTime, video.url]);

  return {
    playerRef,
    onReady,
    onDurationChange,
    onTimeUpdate,
    onPlay,
    onPause,
    onEnded,
    onSeeked,
    onError,
  };
}
