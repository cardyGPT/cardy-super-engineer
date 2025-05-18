
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import SettingsHeader from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const SettingsPage: React.FC = () => {
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const [openAIConnected, setOpenAIConnected] = useState<boolean>(false);
  const [gsuiteConnected, setGsuiteConnected] = useState<boolean>(false);
  const [bitbucketConnected, setBitbucketConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("jira");
  const { toast } = useToast();
  
  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      try {
        // Check Jira connection
        const jiraCredentials = localStorage.getItem("jira_credentials");
        if (jiraCredentials) {
          setJiraConnected(true);
        }
        
        // Check Bitbucket connection
        const { data: bitbucketData, error: bitbucketError } = await supabase
          .from('api_keys')
          .select('*')
          .eq('service', 'bitbucket')
          .maybeSingle();
        
        if (!bitbucketError && bitbucketData) {
          setBitbucketConnected(true);
        }
        
        // Check OpenAI connection
        const { data: openAIData, error: openAIError } = await supabase.functions.invoke('validate-openai', {});
        if (!openAIError && openAIData?.valid) {
          setOpenAIConnected(true);
        }
        
        // Check GSuite connection
        const { data: gsuiteData, error: gsuiteError } = await supabase.functions.invoke('validate-gsuite', {});
        if (!gsuiteError && gsuiteData?.valid) {
          setGsuiteConnected(true);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        toast({
          title: "Error",
          description: "Failed to load some integration settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [toast]);

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <SettingsHeader 
          jiraConnected={jiraConnected} 
          isSaving={isLoading} 
        />
        
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
