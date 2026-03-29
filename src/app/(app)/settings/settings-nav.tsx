"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SettingsNavProps {
  showOrgTab: boolean;
}

export function SettingsNav({ showOrgTab }: SettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-1 border-b">
      <Link
        href="/settings"
        className={cn(
          "px-4 py-2 text-sm font-medium transition-colors hover:text-foreground",
          pathname === "/settings"
            ? "border-b-2 border-foreground text-foreground"
            : "text-muted-foreground",
        )}
      >
        Profile
      </Link>
      {showOrgTab && (
        <Link
          href="/settings/org"
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors hover:text-foreground",
            pathname === "/settings/org"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground",
          )}
        >
          Organization
        </Link>
      )}
    </nav>
  );
}
