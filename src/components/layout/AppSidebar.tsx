
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  FolderKanban, 
  FileUp, 
  Database,
  Home
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const AppSidebar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      title: "Dashboard",
      path: "/",
      icon: Home
    },
    {
      title: "Projects",
      path: "/projects",
      icon: FolderKanban
    },
    {
      title: "Documents",
      path: "/documents",
      icon: FileUp
    },
    {
      title: "Data Models",
      path: "/data-models",
      icon: Database
    }
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border py-6">
        <div className="flex items-center px-4">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-cardy-blue" />
            <span className="font-semibold text-lg text-cardy-blue">Cardy Super Engineer</span>
          </div>
          <div className="ml-auto">
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={isActive(item.path) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
