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
  setCurrentTimeSmooth: (time: number) => void; // 부드러운 업데이트용
  setIsPlaying: (playing: boolean) => void;
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

  // 부드러운 업데이트를 위한 배치 처리
  setCurrentTimeSmooth: (currentTime) => {
    // 이전 timeout이 있으면 취소
    if (smoothUpdateTimeoutId) {
      clearTimeout(smoothUpdateTimeoutId);
    }

    // 즉시 업데이트
    set((state) => ({
      video: { ...state.video, currentTime },
    }));

    // 빠른 연속 업데이트를 배치 처리 (하지만 이미 즉시 업데이트됨)
    smoothUpdateTimeoutId = setTimeout(() => {
      smoothUpdateTimeoutId = null;
    }, 16); // 60fps
  },

  setIsPlaying: (isPlaying) =>
    set((state) => ({
      video: { ...state.video, isPlaying },
    })),

  setVolume: (volume) =>
    set((state) => ({
      video: { ...state.video, volume },
    })),
}));
