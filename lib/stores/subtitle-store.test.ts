import { beforeEach, describe, expect, it } from "vitest";
import { useSubtitleStore, type SubtitleItem } from "./subtitle-store";

// Drive the store directly (no React) and seed a known state before each test.
const seed: SubtitleItem[] = [
  { id: "a", startTime: 2.5, endTime: 5.0, text: "Hello! Welcome." },
  { id: "b", startTime: 6.0, endTime: 9.5, text: "Second line." },
];

const timing = (subs: SubtitleItem[]) =>
  subs.map(({ startTime, endTime, text }) => ({ startTime, endTime, text }));

beforeEach(() => {
  useSubtitleStore.setState({ subtitles: seed.map((s) => ({ ...s })) });
});

describe("exportSRT", () => {
  it("numbers cues and uses a comma millisecond separator", () => {
    expect(useSubtitleStore.getState().exportSRT()).toBe(
      "1\n00:00:02,500 --> 00:00:05,000\nHello! Welcome.\n\n" +
        "2\n00:00:06,000 --> 00:00:09,500\nSecond line.\n"
    );
  });

  it("formats hours/minutes for times past one minute", () => {
    useSubtitleStore.setState({
      subtitles: [{ id: "x", startTime: 3661.25, endTime: 3662, text: "Far" }],
    });
    expect(useSubtitleStore.getState().exportSRT()).toBe(
      "1\n01:01:01,250 --> 01:01:02,000\nFar\n"
    );
  });
});

describe("exportVTT", () => {
  it("emits a WEBVTT header and uses a dot millisecond separator", () => {
    expect(useSubtitleStore.getState().exportVTT()).toBe(
      "WEBVTT\n\n00:00:02.500 --> 00:00:05.000\nHello! Welcome.\n\n" +
        "00:00:06.000 --> 00:00:09.500\nSecond line."
    );
  });
});

describe("importSubtitles", () => {
  it("parses SRT timing and text", () => {
    useSubtitleStore
      .getState()
      .importSubtitles(
        "1\n00:00:01,000 --> 00:00:02,500\nFirst\n\n2\n00:00:03,000 --> 00:00:04,000\nSecond",
        "captions.srt"
      );
    expect(timing(useSubtitleStore.getState().subtitles)).toEqual([
      { startTime: 1.0, endTime: 2.5, text: "First" },
      { startTime: 3.0, endTime: 4.0, text: "Second" },
    ]);
  });

  it("keeps multi-line cue text on SRT import", () => {
    useSubtitleStore
      .getState()
      .importSubtitles("1\n00:00:01,000 --> 00:00:02,000\nLine 1\nLine 2");
    expect(useSubtitleStore.getState().subtitles[0].text).toBe("Line 1\nLine 2");
  });

  it("detects VTT by the WEBVTT header even without a filename", () => {
    useSubtitleStore
      .getState()
      .importSubtitles(
        "WEBVTT\n\n00:00:01.000 --> 00:00:02.500\nFirst\n\n00:00:03.000 --> 00:00:04.000\nSecond"
      );
    expect(timing(useSubtitleStore.getState().subtitles)).toEqual([
      { startTime: 1.0, endTime: 2.5, text: "First" },
      { startTime: 3.0, endTime: 4.0, text: "Second" },
    ]);
  });

  it("detects VTT by the .vtt filename and skips cue identifiers", () => {
    useSubtitleStore
      .getState()
      .importSubtitles(
        "intro\n00:00:01.000 --> 00:00:02.500\nFirst",
        "captions.vtt"
      );
    expect(timing(useSubtitleStore.getState().subtitles)).toEqual([
      { startTime: 1.0, endTime: 2.5, text: "First" },
    ]);
  });
});

describe("round-trips", () => {
  it("preserves timing and text through SRT export then import", () => {
    const srt = useSubtitleStore.getState().exportSRT();
    useSubtitleStore.getState().importSubtitles(srt, "round.srt");
    expect(timing(useSubtitleStore.getState().subtitles)).toEqual(timing(seed));
  });

  it("preserves timing and text through VTT export then import", () => {
    const vtt = useSubtitleStore.getState().exportVTT();
    useSubtitleStore.getState().importSubtitles(vtt);
    expect(timing(useSubtitleStore.getState().subtitles)).toEqual(timing(seed));
  });
});
