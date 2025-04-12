
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import JiraLogin from "@/components/stories/JiraLogin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, CheckCircle2 } from "lucide-react";

const StoriesPage: React.FC = () => {
  const { isAuthenticated, setCredentials, credentials } = useStories();

  const handleLogout = () => {
    setCredentials(null);
  };

  return (
    <AppLayout>
      <div className="container mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Jira Connection</h1>
          
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
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="text-green-500 mr-2 h-6 w-6" />
                  Connection Successful
                </CardTitle>
                <CardDescription>
                  Successfully connected to your Jira account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Domain:</strong> {credentials?.domain}</p>
                  <p><strong>Email:</strong> {credentials?.email}</p>
                  <p><strong>Status:</strong> Connected</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StoriesPage;
