import { describe, expect, it } from "vitest";
import { formatDate, formatRelative } from "@/lib/dates";

describe("formatDate", () => {
  it("formats an ISO date string to 'MMM d, yyyy'", () => {
    expect(formatDate("2024-06-15T12:00:00Z")).toBe("Jun 15, 2024");
  });

  it("formats a Date object to 'MMM d, yyyy'", () => {
    const date = new Date(2023, 0, 1); // January 1, 2023
    expect(formatDate(date)).toBe("Jan 1, 2023");
  });

  it("throws on an invalid date string", () => {
    expect(() => formatDate("not-a-date")).toThrow();
  });
});

describe("formatRelative", () => {
  it("returns a relative time string with suffix", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const result = formatRelative(twoHoursAgo);
    expect(result).toContain("hours ago");
  });

  it("handles an ISO date string input", () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const result = formatRelative(recent.toISOString());
    expect(result).toContain("ago");
  });
});
