
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { CardyLogo } from "./CardyLogo";
import {
  LayoutDashboard,
  FileText,
  Database,
  User,
  Settings,
} from "lucide-react";

export function AppSidebar() {
  const { state } = useSidebar();
  
  return (
    <>
      <Sidebar>
        <SidebarHeader className="flex h-14 items-center border-b px-4">
          <div className="flex items-center gap-2">
            <CardyLogo />
            <span className="font-semibold">Cardy Super Engineer</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Projects">
                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    isActive ? "text-primary" : ""
                  }
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Projects</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Documents">
                <NavLink
                  to="/documents"
                  className={({ isActive }) =>
                    isActive ? "text-primary" : ""
                  }
                >
                  <FileText className="h-5 w-5" />
                  <span>Documents</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Data Models">
                <NavLink
                  to="/data-models"
                  className={({ isActive }) =>
                    isActive ? "text-primary" : ""
                  }
                >
                  <Database className="h-5 w-5" />
                  <span>Data Models</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            Cardy Super Engineer v1.0
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
