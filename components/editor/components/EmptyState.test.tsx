import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the no-subtitles state and fires onAddSubtitle when its button is clicked", async () => {
    const onAddSubtitle = vi.fn();
    render(<EmptyState type="no-subtitles" onAddSubtitle={onAddSubtitle} />);

    expect(screen.getByText("No subtitles yet")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /create first subtitle/i })
    );
    expect(onAddSubtitle).toHaveBeenCalledTimes(1);
  });

  it("omits the create button when onAddSubtitle is not provided", () => {
    render(<EmptyState type="no-subtitles" />);

    expect(screen.getByText("No subtitles yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create first subtitle/i })
    ).toBeNull();
  });

  it("renders the no-results state without a create button", () => {
    render(<EmptyState type="no-results" />);

    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
