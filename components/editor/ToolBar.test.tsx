import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolBar } from "./ToolBar";
import { useSubtitleStore } from "@/lib/stores/subtitle-store";
import { dummySubtitles } from "@/test/fixtures/subtitles";
import { seedSubtitleStore, resetVideoStore } from "@/test/helpers";

beforeEach(() => {
  seedSubtitleStore(dummySubtitles);
  resetVideoStore();
});

afterEach(() => {
  vi.restoreAllMocks();
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
