import { create } from "zustand";
import React from "react";

// Video state type definition
export interface VideoState {
  url: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
}

// Video store interface
interface VideoStore {
  video: VideoState;
  videoRef: React.RefObject<HTMLVideoElement | null> | null;

  // Actions
  setVideoRef: (ref: React.RefObject<HTMLVideoElement | null>) => void;
  setVideoUrl: (url: string) => void;
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
    duration: 30, // 30 seconds for demo data
    currentTime: 0,
    isPlaying: false,
    volume: 1,
  },
  videoRef: null,

  // Video ref management
  setVideoRef: (ref) => set({ videoRef: ref }),

  // Video actions
  setVideoUrl: (url) =>
    set((state) => ({
      video: { ...state.video, url },
    })),

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

  setVolume: (volume) =>
    set((state) => ({
      video: { ...state.video, volume },
    })),
}));
