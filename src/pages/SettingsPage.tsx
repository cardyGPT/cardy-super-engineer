
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import JiraLogin from "@/components/stories/JiraLogin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const SettingsPage: React.FC = () => {
  const { isAuthenticated, setCredentials, credentials } = useStories();

  const handleLogout = () => {
    setCredentials(null);
  };

  return (
    <AppLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="jira" className="w-full">
          <TabsList>
            <TabsTrigger value="jira">Jira Connection</TabsTrigger>
            <TabsTrigger value="openai">OpenAI Connection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="jira">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Jira Connection</h2>
              
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
            )}
          </TabsContent>
          
          <TabsContent value="openai">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">OpenAI Connection</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-500 flex items-center">
                  Not Configured
                </CardTitle>
                <CardDescription>
                  OpenAI integration will be implemented in a future update
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Set up OpenAI integration to enable AI-powered features in the application.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
