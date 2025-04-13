
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JiraSettings from "./JiraSettings";
import OpenAISettings from "./OpenAISettings";
import GSuiteSettings from "./GSuiteSettings";
import BitbucketSettings from "./BitbucketSettings";
import { CheckCircle } from "lucide-react";

interface SettingsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  jiraConnected: boolean;
  openAIConnected: boolean;
  gsuiteConnected: boolean;
  bitbucketConnected: boolean;
  setJiraConnected: (connected: boolean) => void;
  setOpenAIConnected: (connected: boolean) => void;
  setGsuiteConnected: (connected: boolean) => void;
  setBitbucketConnected: (connected: boolean) => void;
}

interface ConfigComponentProps {
  onConfigChange: (connected: boolean) => void;
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({
  activeTab,
  setActiveTab,
  jiraConnected,
  openAIConnected,
  gsuiteConnected,
  bitbucketConnected,
  setJiraConnected,
  setOpenAIConnected,
  setGsuiteConnected,
  setBitbucketConnected
}) => {
  return (
    <Tabs defaultValue="jira" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid grid-cols-4 w-full max-w-md mb-4">
        <TabsTrigger value="jira" className="flex items-center gap-1">
          Jira
          {jiraConnected && (
            <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
          )}
        </TabsTrigger>
        <TabsTrigger value="openai" className="flex items-center gap-1">
          OpenAI
          {openAIConnected && (
            <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
          )}
        </TabsTrigger>
        <TabsTrigger value="gsuite" className="flex items-center gap-1">
          GSuite
          {gsuiteConnected && (
            <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
          )}
        </TabsTrigger>
        <TabsTrigger value="bitbucket" className="flex items-center gap-1">
          Bitbucket
          {bitbucketConnected && (
            <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
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
      
      <TabsContent value="bitbucket">
        <BitbucketSettings onConfigChange={setBitbucketConnected} />
      </TabsContent>
    </Tabs>
  );
};

export default SettingsTabs;
