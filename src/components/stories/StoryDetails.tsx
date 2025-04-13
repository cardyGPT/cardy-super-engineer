
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStories } from "@/contexts/StoriesContext";
import { ProjectContextData } from "@/types/jira";
import ContentDisplay from "./ContentDisplay";
import StoryDetailEmpty from "./StoryDetailEmpty";
import StoryHeader from "./StoryHeader";
import StoryOverview from "./StoryOverview";
import LoadingContent from "./LoadingContent";
import StoryTabContent from "./StoryTabContent";
import { useJiraArtifacts } from "@/hooks/useJiraArtifacts";

interface StoryDetailsProps {
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryDetails: React.FC<StoryDetailsProps> = ({ 
  projectContext, 
  selectedDocuments = [],
  projectContextData = null
}) => {
  const { selectedTicket, generateContent, pushToJira, contentLoading } = useStories();
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  
  const {
    lldContent,
    codeContent,
    testContent,
    isLldGenerated,
    isCodeGenerated,
    isTestsGenerated,
    refreshArtifacts
  } = useJiraArtifacts(selectedTicket);

  // Helper functions for content generation
  const handleGenerateLLD = async () => {
    if (!selectedTicket) return;
    await generateContentWithType('lld', 'lld');
  };

  const handleGenerateCode = async () => {
    if (!selectedTicket) return;
    await generateContentWithType('code', 'code');
  };

  const handleGenerateTests = async () => {
    if (!selectedTicket) return;
    await generateContentWithType('tests', 'tests');
  };

  const handleGenerateAll = async () => {
    if (!selectedTicket) return;
    await generateContentWithType('all', 'lld');
  };

  const generateContentWithType = async (type: 'lld' | 'code' | 'tests' | 'all', tabToActivate: string) => {
    setError(null);

    try {
      const response = await generateContent({
        type,
        jiraTicket: selectedTicket,
        projectContext,
        selectedDocuments
      });
      
      if (response) {
        setActiveTab(tabToActivate);
        refreshArtifacts();
      }
    } catch (err: any) {
      console.error(`Error generating ${type}:`, err);
      setError(err.message || `Failed to generate ${type}`);
    }
  };

  const openTicketInJira = () => {
    if (!selectedTicket || !selectedTicket.domain) return;
    
    const url = `${selectedTicket.domain}/browse/${selectedTicket.key}`;
    window.open(url, '_blank');
  };

  // Wrapper function for pushToJira to match the expected signature in ContentDisplay
  const handlePushToJira = (content: string) => {
    if (!selectedTicket || !selectedTicket.key) return Promise.resolve(false);
    return pushToJira(selectedTicket.key, content);
  };

  if (!selectedTicket) {
    return <StoryDetailEmpty />;
  }

  return (
    <div className="space-y-4">
      <Card className="w-full h-fit">
        <CardHeader>
          <StoryHeader 
            ticket={selectedTicket}
            isLldGenerated={isLldGenerated}
            isCodeGenerated={isCodeGenerated}
            isTestsGenerated={isTestsGenerated}
            onOpenInJira={openTicketInJira}
          />
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lld" disabled={!isLldGenerated && !contentLoading}>LLD</TabsTrigger>
              <TabsTrigger value="code" disabled={!isCodeGenerated && !contentLoading}>Code</TabsTrigger>
              <TabsTrigger value="tests" disabled={!isTestsGenerated && !contentLoading}>Tests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <StoryOverview
                ticket={selectedTicket}
                loading={contentLoading}
                error={error}
                isLldGenerated={isLldGenerated}
                isCodeGenerated={isCodeGenerated}
                isTestsGenerated={isTestsGenerated}
                projectContextData={projectContextData}
                onGenerateLLD={handleGenerateLLD}
                onGenerateCode={handleGenerateCode}
                onGenerateTests={handleGenerateTests}
                onGenerateAll={handleGenerateAll}
              />
            </TabsContent>
            
            <StoryTabContent 
              tabId="lld"
              title="Low Level Design"
              content={lldContent}
              contentType="lld"
              loading={contentLoading}
              ticket={selectedTicket}
              onPushToJira={handlePushToJira}
              projectContext={projectContext}
              selectedDocuments={selectedDocuments}
            />
            
            <StoryTabContent 
              tabId="code"
              title="Implementation Code"
              content={codeContent}
              contentType="code"
              loading={contentLoading}
              ticket={selectedTicket}
              onPushToJira={handlePushToJira}
              projectContext={projectContext}
              selectedDocuments={selectedDocuments}
            />
            
            <StoryTabContent 
              tabId="tests"
              title="Test Cases"
              content={testContent}
              contentType="tests"
              loading={contentLoading}
              ticket={selectedTicket}
              onPushToJira={handlePushToJira}
              projectContext={projectContext}
              selectedDocuments={selectedDocuments}
            />
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryDetails;
