import { describe, expect, it } from "vitest";
import { findCurrentSubtitleId } from "./subtitleUtils";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";

const cue = (id: string, startTime: number, endTime: number): SubtitleItem => ({
  id,
  startTime,
  endTime,
  text: "",
});

// Sorted, non-overlapping cues with gaps between them.
const subs = [cue("a", 0, 2), cue("b", 5, 7), cue("c", 10, 12)];

describe("findCurrentSubtitleId", () => {
  it("returns null for an empty list", () => {
    expect(findCurrentSubtitleId([], 1)).toBeNull();
  });

  it("returns the cue covering the current time", () => {
    expect(findCurrentSubtitleId(subs, 6)).toBe("b");
  });

  it("treats both start and end times as inclusive", () => {
    expect(findCurrentSubtitleId(subs, 5)).toBe("b");
    expect(findCurrentSubtitleId(subs, 7)).toBe("b");
  });

  it("returns null in a gap between cues", () => {
    expect(findCurrentSubtitleId(subs, 3)).toBeNull();
  });

  it("returns null before the first and after the last cue", () => {
    expect(findCurrentSubtitleId(subs, -1)).toBeNull();
    expect(findCurrentSubtitleId(subs, 99)).toBeNull();
  });

  it("falls back to linear search when binary search misses an overlapping cover", () => {
    // Binary search narrows toward b/c and skips the long cue "a"; the linear
    // fallback still finds that "a" covers time 15.
    const overlapping = [cue("a", 0, 20), cue("b", 5, 6), cue("c", 10, 11)];
    expect(findCurrentSubtitleId(overlapping, 15)).toBe("a");
  });
});
