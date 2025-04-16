
import React, { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { CardyLogo } from './CardyLogo';
import { MenuIcon, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserDropdown from './UserDropdown';
import { SidebarProvider } from '@/components/ui/sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-card z-10">
          <div className="container flex h-16 items-center px-4 sm:px-6">
            <button
              className="mr-4 md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
            <div className="flex items-center">
              <CardyLogo />
            </div>
            <div className="ml-auto flex items-center space-x-4">
              {isAuthenticated && <UserDropdown />}
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row">
          {/* Sidebar (mobile-friendly) */}
          <div
            className={`fixed inset-y-0 left-0 z-50 md:relative md:z-0 transform transition-transform duration-300 ease-in-out w-64 bg-card border-r md:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="pt-16 md:pt-0">
              <AppSidebar onLinkClick={() => setSidebarOpen(false)} />
            </div>
          </div>

          {/* Backdrop for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
