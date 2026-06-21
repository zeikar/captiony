import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubtitleItem } from "./SubtitleItem";
import { makeSubtitle } from "@/test/fixtures/subtitles";
import type { SubtitleItem as SubtitleItemType } from "@/lib/stores/subtitle-store";

const formatTime = (s: number) => s.toFixed(2);

function setup(
  opts: {
    subtitle?: Partial<SubtitleItemType>;
    isEditing?: boolean;
    isSelected?: boolean;
  } = {}
) {
  const subtitle = makeSubtitle(opts.subtitle);
  const handlers = {
    onEdit: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onDelete: vi.fn(),
    onSelect: vi.fn(),
    onTimeChange: vi.fn(),
  };
  render(
    <SubtitleItem
      subtitle={subtitle}
      index={1}
      isSelected={opts.isSelected ?? false}
      isEditing={opts.isEditing ?? false}
      formatTime={formatTime}
      {...handlers}
    />
  );
  return { subtitle, ...handlers };
}

describe("SubtitleItem", () => {
  it("renders the cue text, index, and formatted times", () => {
    setup({ subtitle: { text: "Hello there", startTime: 1, endTime: 3 } });

    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // index badge
    expect(screen.getByText("1.00")).toBeInTheDocument(); // start (Header)
    expect(screen.getByText("3.00")).toBeInTheDocument(); // end (Header)
  });

  it("selects the cue when its text is clicked", async () => {
    const { onSelect } = setup({ subtitle: { text: "Click me" } });

    await userEvent.click(screen.getByText("Click me"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("enters edit mode when Edit is clicked, and deletes when Delete is clicked", async () => {
    const { onEdit, onDelete, subtitle } = setup({ subtitle: { text: "X" } });

    await userEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(subtitle);

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("reports start and end time edits via onTimeChange", () => {
    const { onTimeChange, subtitle } = setup({
      subtitle: { startTime: 1, endTime: 3 },
    });

    fireEvent.change(screen.getByDisplayValue("1.00"), {
      target: { value: "2.50" },
    });
    expect(onTimeChange).toHaveBeenCalledWith(subtitle.id, "startTime", "2.50");

    fireEvent.change(screen.getByDisplayValue("3.00"), {
      target: { value: "4.00" },
    });
    expect(onTimeChange).toHaveBeenCalledWith(subtitle.id, "endTime", "4.00");
  });

  it("in edit mode, saves on Cmd+Enter and cancels on Escape", () => {
    const { onSave, onCancel, subtitle } = setup({
      subtitle: { text: "Original" },
      isEditing: true,
    });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Original");

    fireEvent.change(textarea, { target: { value: "Updated" } });
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
    expect(onSave).toHaveBeenCalledWith(subtitle.id, "Updated");

    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("in edit mode, the Save and Cancel buttons are wired", async () => {
    const { onSave, onCancel, subtitle } = setup({
      subtitle: { text: "Hi" },
      isEditing: true,
    });

    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(subtitle.id, "Hi");

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
