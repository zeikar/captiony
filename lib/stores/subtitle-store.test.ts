import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useSubtitleStore, type SubtitleItem } from "./subtitle-store";

// Drive the store directly (no React) and seed a known state before each test.
const seed: SubtitleItem[] = [
  { id: "a", startTime: 2.5, endTime: 5.0, text: "Hello! Welcome." },
  { id: "b", startTime: 6.0, endTime: 9.5, text: "Second line." },
];

const timing = (subs: SubtitleItem[]) =>
  subs.map(({ startTime, endTime, text }) => ({ startTime, endTime, text }));

beforeEach(() => {
  useSubtitleStore.setState({
    subtitles: seed.map((s) => ({ ...s })),
    selectedSubtitleId: null,
    editingSubtitleId: null,
  });
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

describe("addSubtitle", () => {
  it("appends the cue and returns its generated id", () => {
    const id = useSubtitleStore
      .getState()
      .addSubtitle({ startTime: 30, endTime: 32, text: "New" });
    const { subtitles } = useSubtitleStore.getState();
    expect(subtitles).toHaveLength(3);
    expect(subtitles[2]).toEqual({ id, startTime: 30, endTime: 32, text: "New" });
  });
});

describe("updateSubtitle", () => {
  it("applies the given field updates", () => {
    useSubtitleStore.getState().updateSubtitle("a", { text: "Changed" });
    expect(useSubtitleStore.getState().subtitles[0].text).toBe("Changed");
  });

  it("is a no-op (same array reference) when nothing actually changes", () => {
    const before = useSubtitleStore.getState().subtitles;
    // Seed "a" already has this text, so no real change occurs.
    useSubtitleStore.getState().updateSubtitle("a", { text: "Hello! Welcome." });
    expect(useSubtitleStore.getState().subtitles).toBe(before);
  });

  it("ignores updates to an unknown id", () => {
    const before = useSubtitleStore.getState().subtitles;
    useSubtitleStore.getState().updateSubtitle("missing", { text: "x" });
    expect(useSubtitleStore.getState().subtitles).toBe(before);
  });
});

describe("deleteSubtitle", () => {
  it("removes the matching cue", () => {
    useSubtitleStore.getState().deleteSubtitle("a");
    expect(useSubtitleStore.getState().subtitles.map((s) => s.id)).toEqual([
      "b",
    ]);
  });

  it("clears the selection when the selected cue is deleted", () => {
    useSubtitleStore.getState().selectSubtitle("a");
    useSubtitleStore.getState().deleteSubtitle("a");
    expect(useSubtitleStore.getState().selectedSubtitleId).toBeNull();
  });

  it("keeps the selection when a different cue is deleted", () => {
    useSubtitleStore.getState().selectSubtitle("b");
    useSubtitleStore.getState().deleteSubtitle("a");
    expect(useSubtitleStore.getState().selectedSubtitleId).toBe("b");
  });
});

describe("clearAllSubtitles", () => {
  it("empties the list and resets selection and editing state", () => {
    useSubtitleStore.getState().selectSubtitle("a");
    useSubtitleStore.getState().setEditingSubtitle("a");
    useSubtitleStore.getState().clearAllSubtitles();
    const state = useSubtitleStore.getState();
    expect(state.subtitles).toEqual([]);
    expect(state.selectedSubtitleId).toBeNull();
    expect(state.editingSubtitleId).toBeNull();
  });
});

describe("temporal history", () => {
  // Install fake timers ONCE before any test in this block — this means they are
  // active when the outer beforeEach seed fires, so throttleLeading's setTimeout
  // uses the fake clock and we can advance it deterministically.
  beforeAll(() => vi.useFakeTimers());
  afterAll(() => vi.useRealTimers());

  // Runs AFTER the outer beforeEach seed. The seed's setState fired the leading
  // edge of throttleLeading, starting a 300 ms fake-timer cooldown. Advance past
  // it so each test starts with a fresh, unblocked leading edge, then wipe the
  // history recorded by the seed.
  beforeEach(() => {
    vi.advanceTimersByTime(300);
    useSubtitleStore.temporal.getState().clear();
  });

  it("UI-only actions do not record history", () => {
    const { selectSubtitle, setEditingSubtitle, setTimelineScale, setTimelineOffset, setTimelineMode } =
      useSubtitleStore.getState();

    selectSubtitle("a");
    setEditingSubtitle("a");
    setTimelineScale(2);
    setTimelineOffset(100);
    setTimelineMode("centered");

    // None of these change the subtitles array reference, so the equality check
    // in temporal's partialize passes and nothing is recorded.
    expect(useSubtitleStore.temporal.getState().pastStates.length).toBe(0);
  });

  it("a real subtitle change records one entry and undo restores the seed", () => {
    useSubtitleStore.getState().updateSubtitle("a", { text: "Changed" });

    expect(useSubtitleStore.temporal.getState().pastStates.length).toBe(1);

    useSubtitleStore.temporal.getState().undo();

    expect(timing(useSubtitleStore.getState().subtitles)).toEqual(timing(seed));
  });

  it("undo after add-and-select removes the cue and clears the selection", () => {
    // Pre-select an existing cue so we have a known prior selection state.
    useSubtitleStore.getState().selectSubtitle("a");

    // addSubtitle triggers the leading edge (first call in fresh window).
    const newId = useSubtitleStore
      .getState()
      .addSubtitle({ startTime: 20, endTime: 22, text: "New" });
    // selectSubtitle is UI-only — no new history entry.
    useSubtitleStore.getState().selectSubtitle(newId);

    expect(useSubtitleStore.temporal.getState().pastStates.length).toBe(1);

    useSubtitleStore.temporal.getState().undo();

    const state = useSubtitleStore.getState();
    // (a) The added cue must be gone.
    expect(state.subtitles).toHaveLength(2);
    expect(state.subtitles.find((s) => s.id === newId)).toBeUndefined();
    // (b) selectedSubtitleId must no longer point at the removed cue.
    expect(state.selectedSubtitleId).not.toBe(newId);
  });

  it("burst coalesces: trim+add in one throttle window records a single entry", () => {
    // Seed "a" endTime is 5.0; changing to 4.0 is a real mutation (leading edge fires).
    useSubtitleStore.getState().updateSubtitle("a", { endTime: 4.0 });
    // Second call is within the same 300 ms window — throttleLeading suppresses it.
    useSubtitleStore.getState().addSubtitle({ startTime: 10, endTime: 12, text: "Extra" });

    // Only one history entry despite two state-mutating calls.
    expect(useSubtitleStore.temporal.getState().pastStates.length).toBe(1);

    useSubtitleStore.temporal.getState().undo();

    // After undo: "a" must be untrimmed, the added cue must be gone, count back to 2.
    const restored = useSubtitleStore.getState().subtitles;
    expect(restored).toHaveLength(2);
    expect(timing(restored)).toEqual(timing(seed));
  });
});
