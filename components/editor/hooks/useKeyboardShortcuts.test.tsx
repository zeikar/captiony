import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { useVideoStore } from "@/lib/stores/video-store";
import { dummySubtitles } from "@/test/fixtures/subtitles";
import { seedSubtitleStore, resetVideoStore } from "@/test/helpers";

// Host component that mounts the global keydown handler and offers an input to
// exercise the "ignore shortcuts while typing" guard.
function Host() {
  useKeyboardShortcuts();
  return <input data-testid="text-input" />;
}

const textOf = (id: string) =>
  useSubtitleStore.getState().subtitles.find((s) => s.id === id)?.text;
const ids = () => useSubtitleStore.getState().subtitles.map((s) => s.id);

// Fake timers keep the store's leading-edge coalescer deterministic; the inner
// advance + clear leaves each test with empty history and an unblocked edge.
beforeEach(() => {
  vi.useFakeTimers();
  seedSubtitleStore(dummySubtitles);
  vi.advanceTimersByTime(300);
  useSubtitleStore.temporal.getState().clear();
  resetVideoStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useKeyboardShortcuts", () => {
  it("Space toggles play/pause", () => {
    // Local play/pause needs both a loaded URL and a media controller.
    useVideoStore.setState((s) => ({
      video: { ...s.video, url: "blob:test", source: "local" },
      videoRef: {
        current: {
          play: () => Promise.resolve(),
          pause: () => {},
          currentTime: 0,
          duration: 0,
          volume: 1,
        },
      },
    }));
    render(<Host />);
    expect(useVideoStore.getState().video.isPlaying).toBe(false);

    fireEvent.keyDown(document.body, { key: " " });
    expect(useVideoStore.getState().video.isPlaying).toBe(true);
  });

  it("Space is a no-op for a local source with no media controller", () => {
    useVideoStore.setState((s) => ({
      video: { ...s.video, url: "blob:test", source: "local" },
      videoRef: null,
    }));
    render(<Host />);
    fireEvent.keyDown(document.body, { key: " " });
    expect(useVideoStore.getState().video.isPlaying).toBe(false);
  });

  it("Delete removes the selected subtitle", () => {
    render(<Host />);
    act(() => useSubtitleStore.getState().selectSubtitle("a"));

    fireEvent.keyDown(document.body, { key: "Delete" });
    expect(ids()).not.toContain("a");
  });

  it("Escape clears the selection", () => {
    render(<Host />);
    act(() => useSubtitleStore.getState().selectSubtitle("a"));

    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useSubtitleStore.getState().selectedSubtitleId).toBeNull();
  });

  it("Cmd/Ctrl+Z undoes and Cmd/Ctrl+Shift+Z redoes a subtitle change", () => {
    render(<Host />);

    // A real change records exactly one history entry (leading edge, edge unblocked).
    act(() => useSubtitleStore.getState().updateSubtitle("a", { text: "Changed" }));
    expect(textOf("a")).toBe("Changed");
    expect(useSubtitleStore.temporal.getState().pastStates.length).toBe(1);

    // Cmd+Z -> undo
    fireEvent.keyDown(document.body, { key: "z", metaKey: true });
    expect(textOf("a")).toBe("Hello! Welcome.");

    // Cmd+Shift+Z -> redo
    fireEvent.keyDown(document.body, { key: "z", metaKey: true, shiftKey: true });
    expect(textOf("a")).toBe("Changed");
  });

  it("ignores shortcuts while focus is in an input (native text undo wins)", () => {
    render(<Host />);
    const input = screen.getByTestId("text-input");

    // Delete inside an input must NOT delete the selected subtitle.
    act(() => useSubtitleStore.getState().selectSubtitle("a"));
    fireEvent.keyDown(input, { key: "Delete" });
    expect(ids()).toContain("a");

    // Cmd+Z inside an input must NOT trigger store undo.
    act(() => useSubtitleStore.getState().updateSubtitle("a", { text: "Edited" }));
    fireEvent.keyDown(input, { key: "z", metaKey: true });
    expect(textOf("a")).toBe("Edited");
  });

  it("Cmd/Ctrl+A selects all subtitles", () => {
    render(<Host />);
    fireEvent.keyDown(document.body, { key: "a", metaKey: true });
    expect(useSubtitleStore.getState().selectedIds).toHaveLength(
      dummySubtitles.length
    );
  });

  it("Escape clears the multi-selection", () => {
    render(<Host />);
    act(() => {
      useSubtitleStore.getState().selectSubtitle("a");
      useSubtitleStore.getState().toggleSubtitleSelection("b");
    });
    expect(useSubtitleStore.getState().selectedIds).toHaveLength(2);

    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useSubtitleStore.getState().selectedIds).toEqual([]);
    expect(useSubtitleStore.getState().selectedSubtitleId).toBeNull();
  });

  it("Delete with multiple selected removes all of them", () => {
    render(<Host />);
    act(() => {
      useSubtitleStore.getState().selectSubtitle("a");
      useSubtitleStore.getState().toggleSubtitleSelection("b");
    });

    fireEvent.keyDown(document.body, { key: "Delete" });
    expect(ids()).not.toContain("a");
    expect(ids()).not.toContain("b");
  });

  it("Shift+ArrowRight shifts every selected cue by +0.1s", () => {
    render(<Host />);
    act(() => {
      useSubtitleStore.getState().selectSubtitle("a");
      useSubtitleStore.getState().toggleSubtitleSelection("b");
    });

    const before = {
      a: { startTime: dummySubtitles[0].startTime, endTime: dummySubtitles[0].endTime },
      b: { startTime: dummySubtitles[1].startTime, endTime: dummySubtitles[1].endTime },
    };

    fireEvent.keyDown(document.body, { key: "ArrowRight", shiftKey: true });

    const stateA = useSubtitleStore.getState().subtitles.find((s) => s.id === "a")!;
    const stateB = useSubtitleStore.getState().subtitles.find((s) => s.id === "b")!;
    expect(stateA.startTime).toBeCloseTo(before.a.startTime + 0.1);
    expect(stateA.endTime).toBeCloseTo(before.a.endTime + 0.1);
    expect(stateB.startTime).toBeCloseTo(before.b.startTime + 0.1);
    expect(stateB.endTime).toBeCloseTo(before.b.endTime + 0.1);
  });
});
