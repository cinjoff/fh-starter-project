import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks (must come before imports of the module under test) ---

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    organization: {
      list: vi.fn(),
      setActive: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
    push: vi.fn(),
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/sidebar", () => {
  const React = require("react");
  return {
    useSidebar: () => ({
      isMobile: false,
      open: true,
      state: "expanded" as const,
      setOpen: () => {},
      setOpenMobile: () => {},
      openMobile: false,
      toggleSidebar: () => {},
    }),
    SidebarMenu: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement("ul", { role: "list", ...props }, children),
    SidebarMenuItem: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement("li", props, children),
    SidebarMenuButton: React.forwardRef(
      (
        { children, size: _size, disabled, ...props }: Record<string, unknown>,
        ref: React.Ref<HTMLButtonElement>,
      ) =>
        React.createElement(
          "button",
          {
            ref,
            type: "button",
            disabled,
            ...(disabled ? { "data-disabled": "" } : {}),
            ...props,
          },
          children,
        ),
    ),
  };
});

import { useRouter } from "next/navigation";
// Import AFTER mocks
import type React from "react";
import { toast } from "sonner";
import { OrgSwitcher } from "@/components/org-switcher";
import { authClient } from "@/lib/auth-client";

const mockAuthClient = authClient as unknown as {
  organization: {
    list: ReturnType<typeof vi.fn>;
    setActive: ReturnType<typeof vi.fn>;
  };
};

const mockUseRouter = useRouter as unknown as ReturnType<typeof vi.fn>;
const mockToast = toast as unknown as {
  error: ReturnType<typeof vi.fn>;
  success: ReturnType<typeof vi.fn>;
};

const ORG_LIST = [
  { id: "org-1", name: "Acme Corp", slug: "acme" },
  { id: "org-2", name: "Beta Inc", slug: "beta" },
  { id: "platform-id", name: "Platform", slug: "platform" },
];

/** Helper to find the org-switcher trigger button via data-testid */
function getTrigger() {
  return screen.getByTestId("org-switcher-trigger");
}

describe("OrgSwitcher", () => {
  let mockRouter: {
    refresh: ReturnType<typeof vi.fn>;
    push: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter = { refresh: vi.fn(), push: vi.fn() };
    mockUseRouter.mockReturnValue(mockRouter);
    // Default: setActive resolves successfully
    mockAuthClient.organization.setActive.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    cleanup();
  });

  // ---------------------------------------------------------------------------
  // 1. Renders org list (platform excluded)
  // ---------------------------------------------------------------------------

  it("renders org list, excluding the platform org", async () => {
    mockAuthClient.organization.list.mockResolvedValue({
      data: ORG_LIST,
      error: null,
    });

    render(<OrgSwitcher activeOrgId="org-1" />);

    // Wait for the list to load
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    // Open the dropdown
    await userEvent.click(getTrigger());

    // Scope assertions to the dropdown menu content
    const menu = await screen.findByRole("menu");

    // Both non-platform orgs should appear in the menu
    await waitFor(() => {
      expect(within(menu).getByText("Acme Corp")).toBeInTheDocument();
      expect(within(menu).getByText("Beta Inc")).toBeInTheDocument();
    });

    // Platform org must be excluded
    expect(within(menu).queryByText("Platform")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 2. Active org highlighted (CheckIcon present)
  // ---------------------------------------------------------------------------

  it("shows a check icon next to the active org", async () => {
    mockAuthClient.organization.list.mockResolvedValue({
      data: ORG_LIST,
      error: null,
    });

    render(<OrgSwitcher activeOrgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    await userEvent.click(getTrigger());

    const menu = await screen.findByRole("menu");
    await waitFor(() => {
      expect(within(menu).getByText("Acme Corp")).toBeInTheDocument();
    });

    // The active org item should contain an svg (CheckIcon)
    const menuItems = within(menu).getAllByRole("menuitem");
    const acmeItem = menuItems.find((item) => item.textContent?.includes("Acme Corp"));
    expect(acmeItem).toBeDefined();
    expect(acmeItem?.querySelector("svg")).toBeInTheDocument();

    // Non-active org should NOT have a check icon
    const betaItem = menuItems.find((item) => item.textContent?.includes("Beta Inc"));
    expect(betaItem).toBeDefined();
    expect(betaItem?.querySelector("svg")).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 3. Switching orgs calls setActive with correct ID
  // ---------------------------------------------------------------------------

  it("calls setActive with the clicked org id and then refreshes", async () => {
    mockAuthClient.organization.list.mockResolvedValue({
      data: ORG_LIST,
      error: null,
    });

    render(<OrgSwitcher activeOrgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    await userEvent.click(getTrigger());

    const menu = await screen.findByRole("menu");
    await waitFor(() => {
      expect(within(menu).getByText("Beta Inc")).toBeInTheDocument();
    });

    await userEvent.click(within(menu).getByText("Beta Inc"));

    await waitFor(() => {
      expect(mockAuthClient.organization.setActive).toHaveBeenCalledWith({
        organizationId: "org-2",
      });
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Create-org item visible in dropdown
  // ---------------------------------------------------------------------------

  it("renders a Create organization item in the dropdown", async () => {
    mockAuthClient.organization.list.mockResolvedValue({
      data: ORG_LIST,
      error: null,
    });

    render(<OrgSwitcher activeOrgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    await userEvent.click(getTrigger());

    const menu = await screen.findByRole("menu");
    await waitFor(() => {
      expect(within(menu).getByText("Create organization")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Zero-orgs state: dropdown shows only Create organization
  // ---------------------------------------------------------------------------

  it("shows Create organization in dropdown when no orgs are available", async () => {
    mockAuthClient.organization.list.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<OrgSwitcher activeOrgId="org-1" />);

    // Wait for loading to finish — trigger shows "Select org" when no active org found
    await waitFor(() => {
      expect(screen.getByText("Select org")).toBeInTheDocument();
    });

    await userEvent.click(getTrigger());

    const menu = await screen.findByRole("menu");
    await waitFor(() => {
      expect(within(menu).getByText("Create organization")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Loading state
  // ---------------------------------------------------------------------------

  it("shows loading text before the org list resolves", async () => {
    // Never resolve to keep the loading state
    mockAuthClient.organization.list.mockReturnValue(new Promise(() => {}));

    render(<OrgSwitcher activeOrgId="org-1" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Trigger button should be disabled during loading
    const trigger = getTrigger();
    expect(trigger).toHaveAttribute("data-disabled", "");
  });

  // ---------------------------------------------------------------------------
  // 7. Error state: toast called
  // ---------------------------------------------------------------------------

  it("calls toast.error when list() returns an error", async () => {
    mockAuthClient.organization.list.mockResolvedValue({
      data: null,
      error: new Error("Network error"),
    });

    render(<OrgSwitcher activeOrgId="org-1" />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Failed to load organizations");
    });

    // After error, orgs is set to [] — trigger shows "Select org"
    await waitFor(() => {
      expect(screen.getByText("Select org")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Clicking "Create organization" in dropdown navigates to /create-organization
  // ---------------------------------------------------------------------------

  it("navigates to /create-organization when the menu item is clicked", async () => {
    mockAuthClient.organization.list.mockResolvedValue({
      data: ORG_LIST,
      error: null,
    });

    render(<OrgSwitcher activeOrgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    await userEvent.click(getTrigger());

    const menu = await screen.findByRole("menu");
    await waitFor(() => {
      expect(within(menu).getByText("Create organization")).toBeInTheDocument();
    });

    await userEvent.click(within(menu).getByText("Create organization"));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/create-organization");
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Clicking the active org does not call setActive
  // ---------------------------------------------------------------------------

  it("does not call setActive when clicking the already-active org", async () => {
    mockAuthClient.organization.list.mockResolvedValue({
      data: ORG_LIST,
      error: null,
    });

    render(<OrgSwitcher activeOrgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    await userEvent.click(getTrigger());

    const menu = await screen.findByRole("menu");
    await waitFor(() => {
      expect(within(menu).getByText("Acme Corp")).toBeInTheDocument();
    });

    await userEvent.click(within(menu).getByText("Acme Corp"));

    // setActive should NOT be called since org-1 is already active
    expect(mockAuthClient.organization.setActive).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 10. setActive error shows toast
  // ---------------------------------------------------------------------------

  it("shows toast.error when setActive fails", async () => {
    mockAuthClient.organization.list.mockResolvedValue({
      data: ORG_LIST,
      error: null,
    });
    mockAuthClient.organization.setActive.mockResolvedValue({
      error: new Error("Switch failed"),
    });

    render(<OrgSwitcher activeOrgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    await userEvent.click(getTrigger());

    const menu = await screen.findByRole("menu");
    await waitFor(() => {
      expect(within(menu).getByText("Beta Inc")).toBeInTheDocument();
    });

    await userEvent.click(within(menu).getByText("Beta Inc"));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Failed to switch organization");
    });

    // router.refresh should NOT be called on error
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });
});
