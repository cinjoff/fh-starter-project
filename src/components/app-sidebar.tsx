"use client";

import { NavMain } from "@/components/nav-main";
import { OrgSwitcher } from "@/components/org-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";

type Props = {
  activeOrgId: string;
  user: {
    name: string;
    email: string;
  };
};

export function AppSidebar({
  activeOrgId,
  user,
  ...props
}: Props & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" data-testid="app-sidebar" {...props}>
      <SidebarHeader>
        <OrgSwitcher activeOrgId={activeOrgId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
