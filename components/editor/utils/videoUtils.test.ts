import { describe, expect, it } from "vitest";
import { calculateProgress, formatTime } from "./videoUtils";

describe("formatTime", () => {
  it("formats as m:ss.mmm with zero-padded milliseconds", () => {
    expect(formatTime(0)).toBe("0:00.000");
    expect(formatTime(65.5)).toBe("1:05.500");
    expect(formatTime(125.25)).toBe("2:05.250");
  });
});

describe("calculateProgress", () => {
  it("returns a rounded percentage of duration", () => {
    expect(calculateProgress(5, 10)).toBe(50);
    expect(calculateProgress(1, 3)).toBe(33);
  });

  it("returns 0 when duration is zero or negative (no divide-by-zero)", () => {
    expect(calculateProgress(5, 0)).toBe(0);
    expect(calculateProgress(5, -1)).toBe(0);
  });
});
