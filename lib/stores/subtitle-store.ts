import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useVideoStore } from "./video-store";

// Subtitle item type definition
export interface SubtitleItem {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

// Timeline mode type definition
export type TimelineMode = "free" | "centered";

// Store state type definition
interface SubtitleStore {
  // Subtitle state
  subtitles: SubtitleItem[];
  selectedSubtitleId: string | null;
  editingSubtitleId: string | null;

  // Timeline state
  timelineScale: number; // zoom level
  timelineOffset: number; // scroll offset
  timelineMode: TimelineMode; // timeline interaction mode

  // Actions
  addSubtitle: (subtitle: Omit<SubtitleItem, "id">) => string;
  updateSubtitle: (id: string, updates: Partial<SubtitleItem>) => void;
  deleteSubtitle: (id: string) => void;
  selectSubtitle: (id: string | null) => void;
  setEditingSubtitle: (id: string | null) => void;

  setTimelineScale: (scale: number) => void;
  setTimelineOffset: (offset: number) => void;
  setTimelineMode: (mode: TimelineMode) => void;

  // Utility functions
  getCurrentSubtitle: () => SubtitleItem | null;
  exportSRT: () => string;
  exportVTT: () => string;
  importSubtitles: (content: string, filename?: string) => void;
  clearAllSubtitles: () => void;
}

export const useSubtitleStore = create<SubtitleStore>()(
  persist(
    (set, get) => ({
  // Initial state
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
  editingSubtitleId: null,

  timelineScale: 1,
  timelineOffset: 0,
  timelineMode: "free" as TimelineMode,

  // Subtitle actions
  addSubtitle: (subtitle) => {
    const newId = Date.now().toString();
    set((state) => ({
      subtitles: [
        ...state.subtitles,
        {
          ...subtitle,
          id: newId,
        },
      ],
    }));
    return newId;
  },

  updateSubtitle: (id, updates) =>
    set((state) => {
      // 실제 변경사항이 있는지 체크하여 불필요한 업데이트 방지
      const currentSubtitle = state.subtitles.find((sub) => sub.id === id);
      if (!currentSubtitle) return state;

      const hasChanges = Object.entries(updates).some(
        ([key, value]) => currentSubtitle[key as keyof SubtitleItem] !== value
      );

      if (!hasChanges) return state;

      return {
        subtitles: state.subtitles.map((sub) =>
          sub.id === id ? { ...sub, ...updates } : sub
        ),
      };
    }),

  deleteSubtitle: (id) =>
    set((state) => ({
      subtitles: state.subtitles.filter((sub) => sub.id !== id),
      selectedSubtitleId:
        state.selectedSubtitleId === id ? null : state.selectedSubtitleId,
    })),

  selectSubtitle: (selectedSubtitleId) => set({ selectedSubtitleId }),

  setEditingSubtitle: (editingSubtitleId) => set({ editingSubtitleId }),

  // Timeline actions
  setTimelineScale: (timelineScale) => set({ timelineScale }),
  setTimelineOffset: (timelineOffset) => set({ timelineOffset }),
  setTimelineMode: (timelineMode) => set({ timelineMode }),

  // Utility functions
  getCurrentSubtitle: () => {
    const { subtitles } = get();
    const { video } = useVideoStore.getState();
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
        const startTime = formatSRTTime(sub.startTime);
        const endTime = formatSRTTime(sub.endTime);
        return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}\n`;
      })
      .join("\n");
  },

  exportVTT: () => {
    const { subtitles } = get();
    const vttContent = subtitles
      .sort((a, b) => a.startTime - b.startTime)
      .map((sub) => {
        const startTime = formatVTTTime(sub.startTime);
        const endTime = formatVTTTime(sub.endTime);
        return `${startTime} --> ${endTime}\n${sub.text}`;
      })
      .join("\n\n");

    return `WEBVTT\n\n${vttContent}`;
  },

  importSubtitles: (content, filename) => {
    let subtitles: SubtitleItem[] = [];

    // Detect format by filename or content
    const isVTT =
      filename?.toLowerCase().endsWith(".vtt") ||
      content.trim().startsWith("WEBVTT");

    if (isVTT) {
      subtitles = parseVTT(content);
    } else {
      subtitles = parseSRT(content);
    }

    set({ subtitles });
  },

  clearAllSubtitles: () =>
    set({
      subtitles: [],
      selectedSubtitleId: null,
      editingSubtitleId: null,
    }),
}),
    {
      name: "captiony-subtitles",
      // 자막 데이터만 저장하고, UI 상태(선택/편집 중인 항목, 타임라인)는 저장하지 않음
      partialize: (state) => ({ subtitles: state.subtitles }),
    }
  )
);

// Time formatting function (SRT format)
function formatSRTTime(seconds: number): string {
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

// Time formatting function (VTT format)
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms
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

// Time parsing function (SRT format)
function parseTime(timeStr: string): number {
  const [time, ms] = timeStr.split(",");
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
}

// VTT parsing function
function parseVTT(content: string): SubtitleItem[] {
  // Remove WEBVTT header and split by double newlines
  const cleanContent = content.replace(/^WEBVTT[\r\n]*/i, "");
  const blocks = cleanContent.trim().split(/\n\s*\n/);

  return blocks
    .map((block) => {
      const lines = block.trim().split("\n");

      // Skip empty blocks
      if (lines.length < 2) return null;

      // Find the time line (might have cue ID before it)
      let timeLineIndex = 0;
      let timeLine = lines[timeLineIndex];

      // If first line doesn't contain -->, it might be a cue ID
      if (!timeLine.includes("-->")) {
        timeLineIndex = 1;
        timeLine = lines[timeLineIndex];
      }

      const timeMatch = timeLine.match(
        /(\d{2}:\d{2}:\d{2}\.?\d{0,3}) --> (\d{2}:\d{2}:\d{2}\.?\d{0,3})/
      );

      if (!timeMatch) return null;

      const startTime = parseVTTTime(timeMatch[1]);
      const endTime = parseVTTTime(timeMatch[2]);
      const text = lines.slice(timeLineIndex + 1).join("\n");

      return {
        id: Date.now().toString() + Math.random(),
        startTime,
        endTime,
        text,
      };
    })
    .filter(Boolean) as SubtitleItem[];
}

// Time parsing function (VTT format)
function parseVTTTime(timeStr: string): number {
  // Handle both formats: HH:MM:SS.mmm and HH:MM:SS,mmm
  const normalizedTime = timeStr.replace(",", ".");
  const [time, ms = "0"] = normalizedTime.split(".");
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return (
    hours * 3600 + minutes * 60 + seconds + Number(ms.padEnd(3, "0")) / 1000
  );
}
