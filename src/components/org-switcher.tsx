"use client";

import { CaretUpDownIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

type Org = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  activeOrgId: string;
};

function getOrgInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function OrgSwitcher({ activeOrgId }: Props) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    authClient.organization.list().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        toast.error("Failed to load organizations");
        setOrgs([]);
      } else {
        setOrgs((data as Org[]).filter((org) => org.slug !== "platform"));
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeOrg = orgs?.find((org) => org.id === activeOrgId);

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeOrgId || switching) return;
    setSwitching(true);
    const { error } = await authClient.organization.setActive({ organizationId });
    setSwitching(false);
    if (error) {
      toast.error("Failed to switch organization");
      return;
    }
    router.refresh();
  };

  const triggerLabel = loading ? "Loading..." : (activeOrg?.name ?? "Select org");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                disabled={loading || switching}
                data-testid="org-switcher-trigger"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <span className="text-xs font-semibold">
                {activeOrg ? getOrgInitial(activeOrg.name) : "O"}
              </span>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{triggerLabel}</span>
            </div>
            <CaretUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
            className="w-56"
          >
            {orgs?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                data-testid={`org-option-${org.slug}`}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <span className="text-xs">{getOrgInitial(org.name)}</span>
                </div>
                <span className="flex-1">{org.name}</span>
                {org.id === activeOrgId && <CheckIcon className="size-4 shrink-0" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/create-organization")}
              data-testid="org-create-link"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <PlusIcon className="size-4" />
              </div>
              Create organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
