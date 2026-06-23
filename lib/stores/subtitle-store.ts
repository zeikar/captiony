import { create } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
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
  selectedIds: string[]; // full set of selected subtitle ids
  selectedSubtitleId: string | null; // anchor: last-clicked id, target for single-target ops; null iff selectedIds is empty
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
  toggleSubtitleSelection: (id: string) => void;
  rangeSelectSubtitle: (id: string) => void;
  selectAllSubtitles: () => void;
  clearSelection: () => void;
  deleteSelectedSubtitles: () => void;
  nudgeSelectedSubtitles: (deltaSeconds: number) => void;
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
    temporal(
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
  selectedIds: [],
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
      // Check for actual changes to avoid unnecessary updates
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
    set((state) => {
      const newSubtitles = state.subtitles.filter((sub) => sub.id !== id);
      const newSelectedIds = state.selectedIds.filter((sid) => sid !== id);
      return {
        subtitles: newSubtitles,
        selectedIds: newSelectedIds,
        selectedSubtitleId: resolveAnchor(state.selectedSubtitleId, newSelectedIds),
      };
    }),

  selectSubtitle: (id) =>
    set(
      id !== null
        ? { selectedSubtitleId: id, selectedIds: [id] }
        : { selectedSubtitleId: null, selectedIds: [] }
    ),

  toggleSubtitleSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedIds.includes(id);
      if (isSelected) {
        const newSelectedIds = state.selectedIds.filter((sid) => sid !== id);
        return { selectedIds: newSelectedIds, selectedSubtitleId: resolveAnchor(state.selectedSubtitleId, newSelectedIds) };
      } else {
        return { selectedIds: [...state.selectedIds, id], selectedSubtitleId: id };
      }
    }),

  rangeSelectSubtitle: (id) =>
    set((state) => {
      if (!state.selectedSubtitleId) {
        // No anchor — fall back to single select
        return { selectedSubtitleId: id, selectedIds: [id] };
      }
      const anchor = state.selectedSubtitleId;
      const sorted = [...state.subtitles].sort((a, b) => a.startTime - b.startTime);
      const anchorIdx = sorted.findIndex((s) => s.id === anchor);
      const targetIdx = sorted.findIndex((s) => s.id === id);
      if (anchorIdx === -1 || targetIdx === -1) {
        return { selectedSubtitleId: id, selectedIds: [id] };
      }
      const lo = Math.min(anchorIdx, targetIdx);
      const hi = Math.max(anchorIdx, targetIdx);
      const rangeIds = sorted.slice(lo, hi + 1).map((s) => s.id);
      // The prior anchor was the pivot for this range; the new anchor follows the
      // most-recently-clicked id (so the next Shift-click pivots from here) because the
      // anchor doubles as the single-target pointer (Enter/I/O/S ops).
      return { selectedIds: rangeIds, selectedSubtitleId: id };
    }),

  selectAllSubtitles: () =>
    set((state) => {
      const allIds = state.subtitles.map((s) => s.id);
      return { selectedIds: allIds, selectedSubtitleId: resolveAnchor(state.selectedSubtitleId, allIds) };
    }),

  clearSelection: () => set({ selectedSubtitleId: null, selectedIds: [] }),

  deleteSelectedSubtitles: () =>
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const idSet = new Set(state.selectedIds);
      return {
        subtitles: state.subtitles.filter((s) => !idSet.has(s.id)),
        selectedIds: [],
        selectedSubtitleId: null,
      };
    }),

  nudgeSelectedSubtitles: (deltaSeconds) =>
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const idSet = new Set(state.selectedIds);
      // Clamp the whole group by the earliest selected cue so the relative spacing
      // is preserved. A per-cue floor at 0 would desync the group on a large leftward
      // move (e.g. a multi-bar drag), which is why drag commits route through here too.
      const minStart = Math.min(
        ...state.subtitles.filter((s) => idSet.has(s.id)).map((s) => s.startTime)
      );
      const clamped = Math.max(deltaSeconds, -minStart);
      if (clamped === 0) return state; // fully clamped or zero — no movement, no history
      return {
        subtitles: state.subtitles.map((s) =>
          idSet.has(s.id)
            ? { ...s, startTime: s.startTime + clamped, endTime: s.endTime + clamped }
            : s
        ),
      };
    }),

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

    set({ subtitles, selectedIds: [], selectedSubtitleId: null, editingSubtitleId: null });
  },

  clearAllSubtitles: () =>
    set({
      subtitles: [],
      selectedIds: [],
      selectedSubtitleId: null,
      editingSubtitleId: null,
    }),
      }),
      {
        // History snapshot holds subtitle data plus the UI selection/editing IDs so that
        // undo restores a coherent context (no dangling references to removed subtitles).
        // selectedIds is snapshotted so that subtitle-mutating actions (delete/nudge) restore
        // a coherent selection on undo. Equality is still gated on the subtitles array reference
        // only, so pure selection changes (toggle/range/selectAll/clear) do NOT record history.
        partialize: (state) => ({
          subtitles: state.subtitles,
          selectedIds: state.selectedIds,
          selectedSubtitleId: state.selectedSubtitleId,
          editingSubtitleId: state.editingSubtitleId,
        }),
        // Reference equality on the partialized slice: UI-only setters and no-op updates
        // (updateSubtitle returns the same array when nothing changed) won't record history
        equality: (a, b) => a.subtitles === b.subtitles,
        // Coalesce a burst of rapid edits into a single undo step whose snapshot is the
        // pre-burst state, so Cmd/Ctrl+Z after fast typing undoes the whole burst at once
        handleSet: (handleSet) => throttleLeading(handleSet, 300),
      }
    ),
    {
      name: "captiony-subtitles",
      // Persist only subtitle data; UI state (selection, editing, timeline) is not persisted
      partialize: (state) => ({ subtitles: state.subtitles }),
    }
  )
);

// Anchor-resolution rule: keep the prior anchor if it is still in the remaining set;
// otherwise fall back to the last id in the set; null when the set is empty.
function resolveAnchor(currentAnchor: string | null, remaining: string[]): string | null {
  if (currentAnchor !== null && remaining.includes(currentAnchor)) return currentAnchor;
  return remaining.length > 0 ? remaining[remaining.length - 1] : null;
}

// Fires fn synchronously on the FIRST call in a window, then suppresses further
// calls until waitMs of quiet elapses (leading-edge only — no trailing invocation).
// Uses setTimeout so vitest fake timers can control it in tests.
function throttleLeading<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): void => {
    if (timer !== null) {
      clearTimeout(timer);
    } else {
      fn(...args);
    }
    timer = setTimeout(() => {
      timer = null;
    }, waitMs);
  };
}

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
