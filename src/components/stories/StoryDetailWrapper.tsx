
import React, { useEffect, useState } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import StoryDetailEmpty from './StoryDetailEmpty';
import StoryDetail from './StoryDetail';
import { Tab, TabList, TabPanel, Tabs, TabsTrigger } from "@/components/ui/tabs";
import { ProjectContextData } from '@/types/jira';
import StoryTabContent from './StoryTabContent';
import StoryGenerateContent from './generate-content/StoryGenerateContent';
import { useJiraArtifacts } from '@/hooks/useJiraArtifacts';

interface StoryDetailWrapperProps {
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryDetailWrapper: React.FC<StoryDetailWrapperProps> = ({
  projectContext,
  selectedDocuments,
  projectContextData
}) => {
  const { 
    selectedTicket, 
    generateContent, 
    pushToJira, 
    generatedContent, 
    contentLoading 
  } = useStories();
  
  const [activeTab, setActiveTab] = useState("overview");
  
  const {
    lldContent,
    codeContent,
    testContent,
    testCasesContent,
    loading: artifactsLoading,
    refreshArtifacts
  } = useJiraArtifacts(selectedTicket);
  
  // When a ticket is selected, default to overview tab
  useEffect(() => {
    if (selectedTicket) {
      setActiveTab("overview");
    }
  }, [selectedTicket?.id]);
  
  const handleGenerate = async () => {
    if (!selectedTicket) return;
    
    try {
      await generateContent({
        type: 'lld',
        jiraTicket: selectedTicket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || []
      });
    } catch (error) {
      console.error("Error generating content:", error);
    }
  };
  
  const handlePushToJira = async (content: string) => {
    if (!selectedTicket) return false;
    
    try {
      return await pushToJira(selectedTicket.id, content);
    } catch (error) {
      console.error("Error pushing to Jira:", error);
      return false;
    }
  };
  
  if (!selectedTicket) {
    return <StoryDetailEmpty />;
  }
  
  const existingArtifacts = {
    lldContent,
    codeContent,
    testContent,
    testCasesContent
  };
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b px-2">
          <TabList className="flex">
            <TabsTrigger value="overview" className="flex-1 py-3">
              Overview
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex-1 py-3">
              Generate
            </TabsTrigger>
          </TabList>
        </div>
        
        <TabPanel value="overview" className="p-4">
          <StoryDetail ticket={selectedTicket} />
        </TabPanel>
        
        <TabPanel value="generate" className="p-4">
          <StoryGenerateContent 
            ticket={selectedTicket}
            projectContext={projectContext}
            selectedDocuments={selectedDocuments}
            projectContextData={projectContextData}
            onGenerate={generateContent}
            onPushToJira={pushToJira}
            generatedContent={generatedContent}
            isGenerating={contentLoading}
            existingArtifacts={existingArtifacts}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default StoryDetailWrapper;
