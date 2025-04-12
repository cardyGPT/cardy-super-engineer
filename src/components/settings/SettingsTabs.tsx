
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JiraSettings from "./JiraSettings";
import OpenAISettings from "./OpenAISettings";
import GSuiteSettings from "./GSuiteSettings";

interface SettingsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  jiraConnected: boolean;
  openAIConnected: boolean;
  gsuiteConnected: boolean;
  setJiraConnected: (connected: boolean) => void;
  setOpenAIConnected: (connected: boolean) => void;
  setGsuiteConnected: (connected: boolean) => void;
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({
  activeTab,
  setActiveTab,
  jiraConnected,
  openAIConnected,
  gsuiteConnected,
  setJiraConnected,
  setOpenAIConnected,
  setGsuiteConnected
}) => {
  return (
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
  );
};

export default SettingsTabs;
