"use client";

import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react";
import Link from "next/link";
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
import { authClient } from "@/lib/auth-client";

type Org = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  activeOrgId: string;
};

export function OrgSwitcher({ activeOrgId }: Props) {
  const router = useRouter();
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

  const triggerLabel = loading ? "Loading…" : (activeOrg?.name ?? "Select organization");

  const triggerContent = (
    <span className="flex items-center gap-2 text-sm font-medium">
      {triggerLabel}
      <CaretUpDownIcon className="size-4 shrink-0 opacity-60" />
    </span>
  );

  if (!loading && orgs !== null && orgs.length === 0) {
    return (
      <Link href="/create-organization" className="flex items-center gap-2 text-sm font-medium">
        Create organization
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={loading || switching} aria-label="Switch organization">
        {triggerContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {orgs?.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => handleSwitch(org.id)}>
            <span className="flex-1">{org.name}</span>
            {org.id === activeOrgId && <CheckIcon className="size-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/create-organization")}>
          Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
