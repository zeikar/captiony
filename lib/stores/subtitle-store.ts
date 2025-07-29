import { create } from "zustand";

// Subtitle item type definition
export interface SubtitleItem {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

// Video state type definition
export interface VideoState {
  url: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
}

// Store state type definition
interface SubtitleStore {
  // Video state
  video: VideoState;
  
  // Subtitle state
  subtitles: SubtitleItem[];
  selectedSubtitleId: string | null;
  
  // Timeline state
  timelineScale: number; // zoom level
  timelineOffset: number; // scroll offset
  
  // Actions
  setVideoUrl: (url: string) => void;
  setVideoDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  
  addSubtitle: (subtitle: Omit<SubtitleItem, 'id'>) => void;
  updateSubtitle: (id: string, updates: Partial<SubtitleItem>) => void;
  deleteSubtitle: (id: string) => void;
  selectSubtitle: (id: string | null) => void;
  
  setTimelineScale: (scale: number) => void;
  setTimelineOffset: (offset: number) => void;
  
  // Utility functions
  getCurrentSubtitle: () => SubtitleItem | null;
  exportSRT: () => string;
  importSRT: (srtContent: string) => void;
}

export const useSubtitleStore = create<SubtitleStore>((set, get) => ({
  // Initial state
  video: {
    url: null,
    duration: 30, // 30 seconds for demo data
    currentTime: 0,
    isPlaying: false,
    volume: 1,
  },

  subtitles: [
    {
      id: "1",
      startTime: 2.5,
      endTime: 5.0,
      text: "Hello! Welcome to Captiony.",
    },
    {
      id: "2",
      startTime: 6.0,
      endTime: 9.5,
      text: "This is a web-based subtitle editor.",
    },
    {
      id: "3",
      startTime: 10.0,
      endTime: 13.0,
      text: "Upload videos and edit subtitles with ease.",
    },
    {
      id: "4",
      startTime: 14.5,
      endTime: 18.0,
      text: "Drag subtitles on the timeline to move or resize them.",
    },
    {
      id: "5",
      startTime: 19.0,
      endTime: 22.5,
      text: "Export your finished subtitles as SRT files!",
    },
  ],
  selectedSubtitleId: null,

  timelineScale: 1,
  timelineOffset: 0,

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

  // Subtitle actions
  addSubtitle: (subtitle) =>
    set((state) => ({
      subtitles: [
        ...state.subtitles,
        {
          ...subtitle,
          id: Date.now().toString(),
        },
      ],
    })),

  updateSubtitle: (id, updates) =>
    set((state) => ({
      subtitles: state.subtitles.map((sub) =>
        sub.id === id ? { ...sub, ...updates } : sub
      ),
    })),

  deleteSubtitle: (id) =>
    set((state) => ({
      subtitles: state.subtitles.filter((sub) => sub.id !== id),
      selectedSubtitleId:
        state.selectedSubtitleId === id ? null : state.selectedSubtitleId,
    })),

  selectSubtitle: (selectedSubtitleId) => set({ selectedSubtitleId }),

  // Timeline actions
  setTimelineScale: (timelineScale) => set({ timelineScale }),
  setTimelineOffset: (timelineOffset) => set({ timelineOffset }),

  // Utility functions
  getCurrentSubtitle: () => {
    const { video, subtitles } = get();
    return (
      subtitles.find(
        (sub) =>
          video.currentTime >= sub.startTime && video.currentTime <= sub.endTime
      ) || null
    );
  },

  exportSRT: () => {
    const { subtitles } = get();
    return subtitles
      .sort((a, b) => a.startTime - b.startTime)
      .map((sub, index) => {
        const startTime = formatTime(sub.startTime);
        const endTime = formatTime(sub.endTime);
        return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}\n`;
      })
      .join("\n");
  },

  importSRT: (srtContent) => {
    const subtitles = parseSRT(srtContent);
    set({ subtitles });
  },
}));

// Time formatting function (SRT format)
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms
    .toString()
    .padStart(3, "0")}`;
}

// SRT parsing function (simple implementation)
function parseSRT(content: string): SubtitleItem[] {
  const blocks = content.trim().split("\n\n");
  return blocks
    .map((block) => {
      const lines = block.split("\n");
      const timeMatch = lines[1]?.match(
        /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/
      );

      if (!timeMatch) return null;

      const startTime = parseTime(timeMatch[1]);
      const endTime = parseTime(timeMatch[2]);
      const text = lines.slice(2).join("\n");

      return {
        id: Date.now().toString() + Math.random(),
        startTime,
        endTime,
        text,
      };
    })
    .filter(Boolean) as SubtitleItem[];
}

// Time parsing function
function parseTime(timeStr: string): number {
  const [time, ms] = timeStr.split(",");
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
}
