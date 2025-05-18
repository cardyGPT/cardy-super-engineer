
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

export function SettingsTabs() {
  return (
    <Tabs defaultValue="jira">
      <TabsList className="grid grid-cols-5 mb-8">
        {settingsTabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id}>{tab.title}</TabsTrigger>
        ))}
      </TabsList>
      
      {settingsTabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id}>{tab.content}</TabsContent>
      ))}
    </Tabs>
  );
}
