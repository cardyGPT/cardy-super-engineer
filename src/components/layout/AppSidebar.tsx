
import { Link, useLocation } from "react-router-dom";
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
  BrainCircuit,
  FolderKanban,
  ClipboardList,
} from "lucide-react";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  
  const sidebarItems = [
    {
      title: "Projects",
      href: "/projects",
      icon: <FolderKanban className="h-5 w-5" />,
    },
    {
      title: "Docs & Data model",
      href: "/documents",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Smart ER",
      href: "/data-models",
      icon: <Database className="h-5 w-5" />,
    },
    {
      title: "Cardy Mind",
      href: "/cardy-mind",
      icon: <BrainCircuit className="h-5 w-5" />,
    },
    {
      title: "Stories",
      href: "/stories",
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

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
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link
                    to={item.href}
                    className={location.pathname === item.href ? "text-primary" : ""}
                  >
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
    </>
  );
}
