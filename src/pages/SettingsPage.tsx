
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import JiraLogin from "@/components/stories/JiraLogin";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, Settings, BrainCircuit, CheckCircle, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenAISettings from "@/components/settings/OpenAISettings";
import { useStories } from "@/contexts/StoriesContext";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("jira");
  const { isAuthenticated: isJiraAuthenticated } = useStories();
  
  // We'll check if OpenAI API is set
  const isOpenAIConfigured = !!Deno?.env?.get('OPENAI_API_KEY');

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="jira" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="jira" className="relative">
              Jira Connection
              {isJiraAuthenticated && (
                <span className="absolute -top-1 -right-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="openai" className="relative">
              OpenAI API
              {isOpenAIConfigured && (
                <span className="absolute -top-1 -right-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="gsuite" className="relative">
              GSuite Integration
              <span className="absolute -top-1 -right-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="jira" className="space-y-4">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Jira Connection</h2>
              <JiraLogin />
            </div>
          </TabsContent>
          
          <TabsContent value="openai" className="space-y-4">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">OpenAI API Settings</h2>
              <OpenAISettings />
            </div>
          </TabsContent>
          
          <TabsContent value="gsuite" className="space-y-4">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">GSuite Integration</h2>
              <p className="text-gray-500 mb-4">
                Connect your Google Workspace account to export content directly to Google Docs, Sheets, and more.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                  <p className="text-amber-800 text-sm">
                    GSuite integration is currently in development. Check back soon for updates!
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/gsuite-settings">
                  <Mail className="h-4 w-4 mr-2" />
                  GSuite Settings
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
