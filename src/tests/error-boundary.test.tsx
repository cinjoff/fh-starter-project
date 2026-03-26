import { render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/components/error-boundary";

// Component that always throws
function ThrowingChild(): React.ReactNode {
  throw new Error("Test error");
}

// Component that renders normally
function GoodChild(): React.ReactNode {
  return <div>All good</div>;
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders default fallback when an error is caught", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument();
  });

  it("renders custom fallback when provided and error occurs", () => {
    const { container } = render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
    // The custom fallback should replace the default — "Something went wrong"
    // should not appear within this specific ErrorBoundary's output
    expect(container.textContent).not.toContain("Something went wrong");
  });

  it("suppresses console.error output", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    // console.error was called (by React and by componentDidCatch) but suppressed
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
