import { describe, expect, it } from "vitest";
import { formatTime } from "./timeUtils";

describe("formatTime", () => {
  it("formats as mm:ss.cc with zero-padded minutes, seconds, and centiseconds", () => {
    expect(formatTime(0)).toBe("00:00.00");
    expect(formatTime(5.5)).toBe("00:05.50");
    expect(formatTime(65.5)).toBe("01:05.50");
    expect(formatTime(125.25)).toBe("02:05.25");
  });
});
