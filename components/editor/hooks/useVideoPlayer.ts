import { useRef, useEffect, useCallback } from "react";
import { useVideoStore } from "@/lib/stores/video-store";

const SYNC_THRESHOLD = 0.1; // only sync when drift exceeds 0.1s

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSeekingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const {
    video,
    setCurrentTime,
    setCurrentTimeSmooth,
    setIsPlaying,
    setVideoDuration,
    setVolume,
    setVideoRef,
  } = useVideoStore();

  // Register videoRef with the store
  useEffect(() => {
    setVideoRef(videoRef);
  }, [setVideoRef]);

  // RAF-based update for smooth time progress
  const updateCurrentTime = useCallback(() => {
    if (!isSeekingRef.current && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      setCurrentTimeSmooth(currentTime); // use smooth update

      // Continue looping only while playing
      if (!videoRef.current.paused) {
        animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
      }
    }
  }, [setCurrentTimeSmooth]);

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    // timeupdate is used only as a trigger to kick off the RAF-based update loop
    if (!isSeekingRef.current && videoRef.current && !videoRef.current.paused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      updateCurrentTime();
    } else if (isSeekingRef.current && videoRef.current) {
      // During seek, update immediately (no smooth update)
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [setCurrentTime, updateCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    setVideoDuration(videoElement.duration);

    // Sync initial time
    if (video.currentTime !== videoElement.currentTime) {
      videoElement.currentTime = video.currentTime;
    }
  }, [setVideoDuration, video.currentTime]);

  const handleLoadedData = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Sync after data is fully loaded
    if (
      Math.abs(video.currentTime - videoElement.currentTime) > SYNC_THRESHOLD
    ) {
      videoElement.currentTime = video.currentTime;
    }
  }, [video.currentTime]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    // Start RAF-based update loop on play
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    updateCurrentTime();
  }, [setIsPlaying, updateCurrentTime]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    // Cancel RAF on pause
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [setIsPlaying]);

  const handleSeeked = useCallback(() => {
    isSeekingRef.current = false;
    // Restart RAF loop after seek if still playing
    if (videoRef.current && !videoRef.current.paused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      updateCurrentTime();
    }
  }, [updateCurrentTime]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    // Set time to exact duration when video ends
    if (videoRef.current) {
      setCurrentTime(videoRef.current.duration);
    }
    // Cancel RAF
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [setIsPlaying, setCurrentTime]);

  // Set up video event listeners
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !video.url) return;

    const events = [
      ["timeupdate", handleTimeUpdate],
      ["loadedmetadata", handleLoadedMetadata],
      ["loadeddata", handleLoadedData],
      ["play", handlePlay],
      ["pause", handlePause],
      ["seeked", handleSeeked],
      ["ended", handleEnded],
    ] as const;

    // Register event listeners
    events.forEach(([event, handler]) => {
      videoElement.addEventListener(event, handler);
    });

    // Cleanup
    return () => {
      events.forEach(([event, handler]) => {
        videoElement.removeEventListener(event, handler);
      });
    };
  }, [
    video.url,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleLoadedData,
    handlePlay,
    handlePause,
    handleSeeked,
    handleEnded,
  ]);

  // Cancel RAF on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Sync video element when currentTime is changed externally
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !video.url) return;

    if (
      Math.abs(videoElement.currentTime - video.currentTime) > SYNC_THRESHOLD
    ) {
      isSeekingRef.current = true;
      videoElement.currentTime = video.currentTime;
    }
  }, [video.currentTime, video.url]);

  // Player control functions
  const togglePlay = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (video.isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play().catch(console.error);
    }
  }, [video.isPlaying]);

  const handleSeek = useCallback(
    (time: number) => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      isSeekingRef.current = true;
      setCurrentTime(time);
      videoElement.currentTime = time;
    },
    [setCurrentTime]
  );

  const handleVolumeChange = useCallback(
    (volume: number) => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      setVolume(volume);
      videoElement.volume = volume;
    },
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    handleVolumeChange(video.volume > 0 ? 0 : 1);
  }, [video.volume, handleVolumeChange]);

  return {
    videoRef,
    video,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
  };
}
