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
    render(<Host />);
    expect(useVideoStore.getState().video.isPlaying).toBe(false);

    fireEvent.keyDown(document.body, { key: " " });
    expect(useVideoStore.getState().video.isPlaying).toBe(true);
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
});
