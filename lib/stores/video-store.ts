import { create } from "zustand";
import React from "react";

// Minimal controller surface the store needs to drive any video backend.
// HTMLVideoElement satisfies this structurally; react-player's ref does too.
export interface MediaController {
  play(): Promise<void>;
  pause(): void;
  currentTime: number;
  readonly duration: number;
  volume: number;
}

// Video state type definition
export interface VideoState {
  url: string | null;
  source: "local" | "youtube";
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
}

// Video store interface
interface VideoStore {
  video: VideoState;
  videoRef: React.RefObject<MediaController | null> | null;

  // Actions
  setVideoRef: (ref: React.RefObject<MediaController | null> | null) => void;
  clearVideoRef: () => void;
  setVideoUrl: (url: string, source?: "local" | "youtube") => void;
  // Reset to the empty/uploader state; does not touch duration or volume.
  clearVideo: () => void;
  setVideoDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setCurrentTimeSmooth: (time: number) => void; // for smooth updates
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
}

let smoothUpdateTimeoutId: NodeJS.Timeout | null = null;

export const useVideoStore = create<VideoStore>((set, get) => ({
  // Initial state
  video: {
    url: null,
    source: "local",
    duration: 30, // 30 seconds for demo data
    currentTime: 0,
    isPlaying: false,
    volume: 1,
  },
  videoRef: null,

  // Video ref management
  setVideoRef: (ref) => set({ videoRef: ref }),
  clearVideoRef: () => set({ videoRef: null }),

  // Video actions
  setVideoUrl: (url, source = "local") =>
    set((state) => ({
      video: { ...state.video, url, source },
    })),

  // Return to the empty/uploader state; used by uploader-return and YouTube
  // error recovery. Volume is intentionally preserved across resets.
  clearVideo: () => {
    set((state) => ({
      video: {
        ...state.video,
        url: null,
        source: "local",
        currentTime: 0,
        isPlaying: false,
      },
      videoRef: null,
    }));
  },

  setVideoDuration: (duration) =>
    set((state) => ({
      video: { ...state.video, duration },
    })),

  setCurrentTime: (currentTime) =>
    set((state) => ({
      video: { ...state.video, currentTime },
    })),

  // Batched processing for smooth updates
  setCurrentTimeSmooth: (currentTime) => {
    // Cancel previous timeout if pending
    if (smoothUpdateTimeoutId) {
      clearTimeout(smoothUpdateTimeoutId);
    }

    // Update immediately
    set((state) => ({
      video: { ...state.video, currentTime },
    }));

    // Batch rapid successive updates (already updated above immediately)
    smoothUpdateTimeoutId = setTimeout(() => {
      smoothUpdateTimeoutId = null;
    }, 16); // 60fps
  },

  setIsPlaying: (isPlaying) =>
    set((state) => ({
      video: { ...state.video, isPlaying },
    })),

  togglePlayPause: () => {
    const { video, videoRef } = get();
    const videoElement = videoRef?.current;

    if (videoElement) {
      if (video.isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play().catch(console.error);
      }
    }

    set((state) => ({
      video: { ...state.video, isPlaying: !state.video.isPlaying },
    }));
  },

  seekTo: (time) => {
    const { videoRef } = get();
    const videoElement = videoRef?.current;
    if (videoElement) {
      videoElement.currentTime = time;
    }
    set((state) => ({
      video: { ...state.video, currentTime: time },
    }));
  },

  // Write to both Zustand state and the active controller so that volume
  // changes from shared UI (e.g. VolumeControl) take immediate effect.
  setVolume: (volume) => {
    const { videoRef } = get();
    if (videoRef?.current) {
      videoRef.current.volume = volume;
    }
    set((state) => ({
      video: { ...state.video, volume },
    }));
  },
}));
