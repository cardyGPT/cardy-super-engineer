
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { CardyLogo } from "./CardyLogo";
import { LayoutDashboard, FileText, Database, User, Settings, BrainCircuit, FolderKanban, ClipboardList, BookOpenCheck, Workflow, Code, TestTube, HelpCircle } from "lucide-react";

interface AppSidebarProps {
  onLinkClick?: () => void;
}

export function AppSidebar({
  onLinkClick
}: AppSidebarProps) {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  
  const sidebarItems = [
    {
      title: "Projects",
      href: "/projects",
      icon: <FolderKanban className="h-5 w-5" />
    },
    {
      title: "Document Processing",
      href: "/document-processing",
      icon: <BookOpenCheck className="h-5 w-5" />
    },
    {
      title: "Generate",
      href: "/generate",
      icon: <Code className="h-5 w-5" />
    }, 
    {
      title: "n8n Workflows",
      href: "/n8n-workflows",
      icon: <Workflow className="h-5 w-5" />
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />
    },
    {
      title: "Help",
      href: "/help",
      icon: <HelpCircle className="h-5 w-5" />
    }
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link to={item.href} className={location.pathname === item.href ? "text-primary" : ""} onClick={onLinkClick}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          Cardy Super Engineer v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
