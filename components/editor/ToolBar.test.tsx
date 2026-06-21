import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToolBar } from "./ToolBar";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { dummySubtitles } from "@/test/fixtures/subtitles";
import { seedSubtitleStore, resetVideoStore } from "@/test/helpers";

const temporal = () => useSubtitleStore.temporal.getState();
const undoBtn = () => screen.getByRole("button", { name: /undo/i });
const redoBtn = () => screen.getByRole("button", { name: /redo/i });
const textOf = (id: string) =>
  useSubtitleStore.getState().subtitles.find((s) => s.id === id)?.text;

// Fake timers keep the store's leading-edge coalescer deterministic.
beforeEach(() => {
  vi.useFakeTimers();
  seedSubtitleStore(dummySubtitles);
  vi.advanceTimersByTime(300);
  temporal().clear();
  resetVideoStore();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("ToolBar undo/redo controls", () => {
  it("disables Undo and Redo when history is empty", () => {
    render(<ToolBar />);
    expect(undoBtn()).toBeDisabled();
    expect(redoBtn()).toBeDisabled();
  });

  it("a change enables Undo; clicking undo/redo flips both the state and the buttons", () => {
    render(<ToolBar />);

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

describe("ToolBar New Project", () => {
  it("clears all subtitles when the confirm dialog is accepted", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ToolBar />);

    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    expect(useSubtitleStore.getState().subtitles).toHaveLength(0);
  });

  it("keeps subtitles when the confirm dialog is cancelled", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ToolBar />);

    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    expect(useSubtitleStore.getState().subtitles.length).toBeGreaterThan(0);
  });
});
