import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Factory } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OpenAISettings from "@/components/settings/OpenAISettings";
import GSuiteSettings from "@/components/settings/GSuiteSettings";
import JiraSettings from "@/components/settings/JiraSettings";

const SettingsPage: React.FC = () => {
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const [openAIConnected, setOpenAIConnected] = useState<boolean>(false);
  const [gsuiteConnected, setGsuiteConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("jira");
  
  const navigate = useNavigate();

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      try {
        // Check Jira connection
        const jiraCredentials = JSON.parse(localStorage.getItem("jira_credentials") || "null");
        if (jiraCredentials) {
          setJiraConnected(true);
        }
        
        // Note: OpenAI and GSuite status will be checked by their respective components
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Function to navigate back to Jira stories
  const navigateToStories = () => {
    navigate('/stories');
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          
          {jiraConnected && (
            <Button onClick={navigateToStories} variant="outline" className="flex items-center">
              <Factory className="h-4 w-4 mr-2" />
              Back to Jira Stories
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="jira" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
            <TabsTrigger value="jira" className="relative">
              Jira
              {jiraConnected && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-none absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="openai" className="relative">
              OpenAI
              {openAIConnected && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-none absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="gsuite" className="relative">
              GSuite
              {gsuiteConnected && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-none absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="jira">
            <JiraSettings onConfigChange={setJiraConnected} />
          </TabsContent>
          
          <TabsContent value="openai">
            <OpenAISettings onConfigChange={setOpenAIConnected} />
          </TabsContent>
          
          <TabsContent value="gsuite">
            <GSuiteSettings onConfigChange={setGsuiteConnected} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
