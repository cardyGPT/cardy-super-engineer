
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsTabs from "@/components/settings/SettingsTabs";

const SettingsPage: React.FC = () => {
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const [openAIConnected, setOpenAIConnected] = useState<boolean>(false);
  const [gsuiteConnected, setGsuiteConnected] = useState<boolean>(false);
  const [bitbucketConnected, setBitbucketConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("jira");
  
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
        
        // Check Bitbucket connection
        const bitbucketCredentials = JSON.parse(localStorage.getItem("bitbucket_credentials") || "null");
        if (bitbucketCredentials) {
          setBitbucketConnected(true);
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

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <SettingsHeader jiraConnected={jiraConnected} />
        
        <SettingsTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          jiraConnected={jiraConnected}
          openAIConnected={openAIConnected}
          gsuiteConnected={gsuiteConnected}
          bitbucketConnected={bitbucketConnected}
          setJiraConnected={setJiraConnected}
          setOpenAIConnected={setOpenAIConnected}
          setGsuiteConnected={setGsuiteConnected}
          setBitbucketConnected={setBitbucketConnected}
        />
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
