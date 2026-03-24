import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubmitButton } from "@/components/submit-button";

describe("SubmitButton", () => {
  it("renders a button with children text", () => {
    render(<SubmitButton>Save</SubmitButton>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeInTheDocument();
  });

  it("passes through className prop", () => {
    render(<SubmitButton className="custom-class">Submit</SubmitButton>);
    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toHaveClass("custom-class");
  });

  it("renders with default text when not pending", () => {
    render(<SubmitButton pendingText="Loading...">Click me</SubmitButton>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders as a submit button by default", () => {
    render(<SubmitButton>Go</SubmitButton>);
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toHaveAttribute("type", "submit");
  });
});
