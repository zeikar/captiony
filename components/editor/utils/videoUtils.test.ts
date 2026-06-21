import { describe, expect, it } from "vitest";
import { calculateProgress } from "./videoUtils";

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
