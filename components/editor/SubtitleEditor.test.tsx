import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SubtitleEditor } from "./SubtitleEditor";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { dummySubtitles } from "@/test/fixtures/subtitles";
import { seedSubtitleStore, resetVideoStore } from "@/test/helpers";

const undoBtn = () => screen.getByRole("button", { name: /undo/i });
const redoBtn = () => screen.getByRole("button", { name: /redo/i });
const textOf = (id: string) =>
  useSubtitleStore.getState().subtitles.find((s) => s.id === id)?.text;

// Fake timers keep the store's leading-edge coalescer deterministic.
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

describe("SubtitleEditor undo/redo header controls", () => {
  it("disables Undo and Redo when history is empty", () => {
    render(<SubtitleEditor />);
    expect(undoBtn()).toBeDisabled();
    expect(redoBtn()).toBeDisabled();
  });

  it("a change enables Undo; clicking undo/redo flips both the state and the buttons", () => {
    render(<SubtitleEditor />);

    act(() =>
      useSubtitleStore.getState().updateSubtitle("a", { text: "Changed" })
    );
    expect(undoBtn()).toBeEnabled();
    expect(redoBtn()).toBeDisabled();

    fireEvent.click(undoBtn());
    expect(textOf("a")).toBe("Hello! Welcome.");
    expect(undoBtn()).toBeDisabled();
    expect(redoBtn()).toBeEnabled();

    fireEvent.click(redoBtn());
    expect(textOf("a")).toBe("Changed");
    expect(undoBtn()).toBeEnabled();
    expect(redoBtn()).toBeDisabled();
  });
});
