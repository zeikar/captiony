import { useRef, useEffect, useCallback } from "react";
import { useVideoStore } from "@/lib/stores/video-store";
import { useNotification } from "@/contexts/notification-context";

const SYNC_THRESHOLD = 0.1; // only sync when drift exceeds 0.1s

// YouTube playback path. Unlike the local <video> path there is no RAF loop:
// react-player surfaces YouTube's ~100ms onTimeUpdate, which is the best
// resolution the IFrame API gives us, so we read currentTime straight from it.
export function useYouTubePlayer() {
  const playerRef = useRef<HTMLVideoElement>(null);
  // Guards the external-seek effect from re-triggering during an active seek,
  // mirroring the same pattern used in useVideoPlayer for the local <video>.
  const isSeekingRef = useRef(false);

  const {
    video,
    setCurrentTime,
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

  const onReady = useCallback(() => {
    const player = playerRef.current;
    // onDurationChange is the authoritative source; onReady is a best-effort
    // early read. Skip NaN/0 so we don't overwrite a valid duration with junk.
    if (player && Number.isFinite(player.duration) && player.duration > 0) {
      setVideoDuration(player.duration);
    }
  }, [setVideoDuration]);

  const onDurationChange = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      setVideoDuration(e.currentTarget.duration);
    },
    [setVideoDuration]
  );

  const onTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      // Skip while a programmatic seek is in progress to avoid pushing the
      // mid-seek time back into the store and retriggering the seek effect.
      if (isSeekingRef.current) return;
      setCurrentTime(e.currentTarget.currentTime);
    },
    [setCurrentTime]
  );

  const onPlay = useCallback(() => {
    setIsPlaying(true);
  }, [setIsPlaying]);

  const onPause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    if (playerRef.current) {
      setCurrentTime(playerRef.current.duration);
    }
  }, [setIsPlaying, setCurrentTime]);

  const onSeeked = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      isSeekingRef.current = false;
      setCurrentTime(e.currentTarget.currentTime);
    },
    [setCurrentTime]
  );

  const onError = useCallback(() => {
    // The video can't be embedded (private, age/region-restricted, or embedding
    // disabled). Notify the user then return to the uploader so the UI doesn't hang.
    addErrorNotification(
      "This video can't be embedded — it may be private, age-restricted, region-restricted, or have embedding disabled."
    );
    clearVideo();
  }, [addErrorNotification, clearVideo]);

  // Drive the player when currentTime changes externally (keyboard/timeline/
  // progress-bar seeks). isSeekingRef prevents onTimeUpdate from echoing the
  // mid-seek position back into the store and re-triggering this effect.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !video.url) return;

    if (Math.abs(player.currentTime - video.currentTime) > SYNC_THRESHOLD) {
      isSeekingRef.current = true;
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
