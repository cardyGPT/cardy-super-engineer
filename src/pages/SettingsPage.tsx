
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import JiraLogin from "@/components/stories/JiraLogin";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, Settings, BrainCircuit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenAISettings from "@/components/settings/OpenAISettings";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("jira");

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="jira" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="jira">Jira Connection</TabsTrigger>
            <TabsTrigger value="openai">OpenAI API</TabsTrigger>
            <TabsTrigger value="gsuite">GSuite Integration</TabsTrigger>
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
