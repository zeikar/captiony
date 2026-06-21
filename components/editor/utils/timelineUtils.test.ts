import { describe, expect, it } from "vitest";
import {
  arrangeSubtitlesInLayers,
  checkSubtitleOverlap,
  findOverlappingSubtitles,
  formatTime,
  getTimeFromX,
  getXFromTime,
} from "./timelineUtils";
import type { SubtitleItem } from "@/lib/stores/subtitle-store";

const cue = (id: string, startTime: number, endTime: number): SubtitleItem => ({
  id,
  startTime,
  endTime,
  text: "",
});

describe("formatTime", () => {
  it("formats as mm:ss.cc with zero-padded centiseconds", () => {
    expect(formatTime(0)).toBe("00:00.00");
    expect(formatTime(65.5)).toBe("01:05.50");
    expect(formatTime(125.25)).toBe("02:05.25");
  });
});

describe("coordinate conversion", () => {
  it("maps an X coordinate to a time relative to the offset", () => {
    expect(getTimeFromX(100, 0, 50)).toBe(2);
    expect(getTimeFromX(100, 10, 50)).toBe(12);
  });

  it("maps a time to an X coordinate relative to the offset", () => {
    expect(getXFromTime(2, 0, 50)).toBe(100);
    expect(getXFromTime(12, 10, 50)).toBe(100);
  });

  it("round-trips X -> time -> X", () => {
    const [x, offset, pps] = [137, 4.5, 80];
    expect(getXFromTime(getTimeFromX(x, offset, pps), offset, pps)).toBeCloseTo(
      x
    );
  });
});

describe("checkSubtitleOverlap", () => {
  it("detects overlapping ranges regardless of argument order", () => {
    expect(checkSubtitleOverlap(cue("a", 0, 5), cue("b", 3, 8))).toBe(true);
    expect(checkSubtitleOverlap(cue("b", 3, 8), cue("a", 0, 5))).toBe(true);
  });

  it("treats touching edges as non-overlapping (strict comparison)", () => {
    expect(checkSubtitleOverlap(cue("a", 0, 5), cue("b", 5, 10))).toBe(false);
  });

  it("returns false for fully disjoint ranges", () => {
    expect(checkSubtitleOverlap(cue("a", 0, 2), cue("b", 5, 7))).toBe(false);
  });

  it("detects full containment", () => {
    expect(checkSubtitleOverlap(cue("a", 0, 10), cue("b", 3, 5))).toBe(true);
  });
});

describe("findOverlappingSubtitles", () => {
  it("returns overlapping cues, excluding the target itself", () => {
    const target = cue("t", 4, 8);
    const subs = [cue("a", 0, 2), cue("b", 5, 6), target, cue("c", 8, 10)];
    expect(findOverlappingSubtitles(subs, target).map((s) => s.id)).toEqual([
      "b",
    ]);
  });
});

describe("arrangeSubtitlesInLayers", () => {
  it("keeps non-overlapping cues on a single layer", () => {
    const layers = arrangeSubtitlesInLayers([cue("a", 0, 2), cue("b", 3, 5)]);
    expect(layers.map((l) => l.map((s) => s.id))).toEqual([["a", "b"]]);
  });

  it("pushes overlapping cues onto new layers", () => {
    const layers = arrangeSubtitlesInLayers([cue("a", 0, 5), cue("b", 3, 8)]);
    expect(layers.map((l) => l.map((s) => s.id))).toEqual([["a"], ["b"]]);
  });

  it("sorts by start time and packs into the earliest free layer", () => {
    // Passed out of order; a(0-2) and c(3-4) fit on layer 0, b(1-3) goes to layer 1.
    const layers = arrangeSubtitlesInLayers([
      cue("c", 3, 4),
      cue("a", 0, 2),
      cue("b", 1, 3),
    ]);
    expect(layers.map((l) => l.map((s) => s.id))).toEqual([["a", "c"], ["b"]]);
  });
});
