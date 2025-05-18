
import BitbucketSettings from "./BitbucketSettings";
import GSuiteSettings from "./GSuiteSettings";
import JiraSettings from "./JiraSettings";
import OpenAISettings from "./OpenAISettings";
import N8nSettings from "./N8nSettings";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const settingsTabs = [
  {
    id: "jira",
    title: "Jira",
    content: <JiraSettings />,
  },
  {
    id: "gsuite",
    title: "GSuite",
    content: <GSuiteSettings />,
  },
  {
    id: "bitbucket",
    title: "Bitbucket",
    content: <BitbucketSettings />,
  },
  {
    id: "openai",
    title: "OpenAI",
    content: <OpenAISettings />,
  },
  {
    id: "n8n",
    title: "n8n",
    content: <N8nSettings />,
  },
];

interface SettingsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  jiraConnected: boolean;
  openAIConnected: boolean;
  gsuiteConnected: boolean;
  bitbucketConnected: boolean;
  setJiraConnected: (value: boolean) => void;
  setOpenAIConnected: (value: boolean) => void;
  setGsuiteConnected: (value: boolean) => void;
  setBitbucketConnected: (value: boolean) => void;
}

export function SettingsTabs({
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
}: SettingsTabsProps) {
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab}
    >
      <TabsList className="grid grid-cols-5 mb-8">
        {settingsTabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id}>{tab.title}</TabsTrigger>
        ))}
      </TabsList>
      
      <TabsContent value="jira">
        <JiraSettings 
          onConfigChange={setJiraConnected}
        />
      </TabsContent>
      <TabsContent value="gsuite">
        <GSuiteSettings 
          onConfigChange={setGsuiteConnected}
        />
      </TabsContent>
      <TabsContent value="bitbucket">
        <BitbucketSettings 
          onConfigChange={setBitbucketConnected}
        />
      </TabsContent>
      <TabsContent value="openai">
        <OpenAISettings 
          onConfigChange={setOpenAIConnected}
        />
      </TabsContent>
      <TabsContent value="n8n">
        <N8nSettings />
      </TabsContent>
    </Tabs>
  );
}
