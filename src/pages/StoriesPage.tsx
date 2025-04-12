
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import JiraLogin from "@/components/stories/JiraLogin";
import StoryList from "@/components/stories/StoryList";
import StoryDetail from "@/components/stories/StoryDetail";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const StoriesPage: React.FC = () => {
  const { isAuthenticated, setCredentials, selectedTicket } = useStories();

  const handleLogout = () => {
    setCredentials(null);
  };

  return (
    <AppLayout>
      <div className="container mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Jira Stories</h1>
          
          {isAuthenticated && (
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect Jira
            </Button>
          )}
        </div>

        {!isAuthenticated ? (
          <JiraLogin />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <StoryList />
            </div>
            <div className="md:col-span-2">
              <StoryDetail />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StoriesPage;
