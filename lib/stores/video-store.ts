import { create } from "zustand";

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

  // Actions
  setVideoUrl: (url: string) => void;
  setVideoDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  // Initial state
  video: {
    url: null,
    duration: 30, // 30 seconds for demo data
    currentTime: 0,
    isPlaying: false,
    volume: 1,
  },

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

  setIsPlaying: (isPlaying) =>
    set((state) => ({
      video: { ...state.video, isPlaying },
    })),

  setVolume: (volume) =>
    set((state) => ({
      video: { ...state.video, volume },
    })),
}));
