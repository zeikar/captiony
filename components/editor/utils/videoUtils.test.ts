import { describe, expect, it } from "vitest";
import { calculateProgress, isYouTubeUrl } from "./videoUtils";

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

describe("isYouTubeUrl", () => {
  it("accepts canonical watch/shorts/youtu.be URLs across YouTube hosts", () => {
    expect(isYouTubeUrl("https://www.youtube.com/watch?v=abc123")).toBe(true);
    expect(isYouTubeUrl("https://youtube.com/watch?v=abc123")).toBe(true);
    expect(isYouTubeUrl("https://m.youtube.com/watch?v=abc123")).toBe(true);
    expect(isYouTubeUrl("https://music.youtube.com/watch?v=abc123")).toBe(true);
    expect(isYouTubeUrl("https://youtu.be/abc123")).toBe(true);
    expect(isYouTubeUrl("https://www.youtube.com/shorts/abc123")).toBe(true);
  });

  it("rejects spoofed hosts that merely contain a YouTube path", () => {
    // The exact hostname allow-list is the security boundary: a substring
    // check would wrongly accept this.
    expect(isYouTubeUrl("https://evil.com/youtube.com/watch?v=x")).toBe(false);
  });

  it("rejects non-YouTube, malformed, and non-http(s) URLs", () => {
    expect(isYouTubeUrl("")).toBe(false);
    expect(isYouTubeUrl("not a url")).toBe(false);
    expect(isYouTubeUrl("blob:http://localhost/some-uuid")).toBe(false);
    expect(isYouTubeUrl("file:///path/to/video.mp4")).toBe(false);
    expect(isYouTubeUrl("https://vimeo.com/123")).toBe(false);
  });

  it("rejects YouTube hosts without a real video target", () => {
    expect(isYouTubeUrl("https://youtube.com/")).toBe(false);
    expect(isYouTubeUrl("https://www.youtube.com/watch")).toBe(false); // no v param
    expect(isYouTubeUrl("https://www.youtube.com/watch?v=")).toBe(false); // empty v
    expect(isYouTubeUrl("https://youtu.be/")).toBe(false); // no id
  });
});
