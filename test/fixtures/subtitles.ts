import type { SubtitleItem } from "@/lib/stores/subtitle-store";

// Reusable dummy subtitles for tests. Keep these small and deterministic.

export const dummySubtitles: SubtitleItem[] = [
  { id: "a", startTime: 2.5, endTime: 5.0, text: "Hello! Welcome." },
  { id: "b", startTime: 6.0, endTime: 9.5, text: "Second line." },
  { id: "c", startTime: 10.0, endTime: 13.0, text: "Third line." },
];

// Build a single subtitle, overriding any field.
export const makeSubtitle = (
  overrides: Partial<SubtitleItem> = {}
): SubtitleItem => ({
  id: "s1",
  startTime: 1,
  endTime: 3,
  text: "Sample line",
  ...overrides,
});
