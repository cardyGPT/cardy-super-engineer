
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
                <Link
                  to="/projects"
                  className={(props) =>
                    window.location.pathname === "/projects" ? "text-primary" : ""
                  }
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Projects</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Documents">
                <Link
                  to="/documents"
                  className={(props) =>
                    window.location.pathname === "/documents" ? "text-primary" : ""
                  }
                >
                  <FileText className="h-5 w-5" />
                  <span>Documents</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Data Models">
                <Link
                  to="/data-models"
                  className={(props) =>
                    window.location.pathname === "/data-models" ? "text-primary" : ""
                  }
                >
                  <Database className="h-5 w-5" />
                  <span>Data Models</span>
                </Link>
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
