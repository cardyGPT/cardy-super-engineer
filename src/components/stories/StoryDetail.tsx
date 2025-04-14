
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStories } from "@/contexts/StoriesContext";
import { JiraTicket, ProjectContextData } from "@/types/jira";
import { supabase } from "@/lib/supabase";
import ContentDisplay from "./ContentDisplay";
import StoryDetailEmpty from "./StoryDetailEmpty";
import StoryHeader from "./StoryHeader";
import StoryOverview from "./StoryOverview";
import LoadingContent from "./LoadingContent";
import StoryTabContent from "./StoryTabContent";
import { useArtifacts } from "./hooks/useArtifacts";

interface StoryDetailProps {
  ticket: JiraTicket | null;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryDetail: React.FC<StoryDetailProps> = ({ 
  ticket, 
  projectContext, 
  selectedDocuments = [],
  projectContextData = null
}) => {
  const { generateContent, pushToJira } = useStories();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    lldContent,
    codeContent,
    testContent,
    isLldGenerated,
    isCodeGenerated,
    isTestsGenerated,
    checkExistingArtifacts
  } = useArtifacts(ticket);

  // Check if artifacts already exist when ticket changes
  useEffect(() => {
    if (ticket) {
      checkExistingArtifacts();
    }
  }, [ticket, checkExistingArtifacts]);

  const handleGenerateLLD = async () => {
    if (!ticket) return;
    await generateContentWithType('lld', 'lld');
  };

  const handleGenerateCode = async () => {
    if (!ticket) return;
    await generateContentWithType('code', 'code');
  };

  const handleGenerateTests = async () => {
    if (!ticket) return;
    await generateContentWithType('tests', 'tests');
  };

  const handleGenerateAll = async () => {
    if (!ticket) return;
    await generateContentWithType('all', 'lld');
  };

  const generateContentWithType = async (type: 'lld' | 'code' | 'tests' | 'all', tabToActivate: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await generateContent({
        type,
        jiraTicket: ticket,
        projectContext,
        selectedDocuments
      });
      
      if (response) {
        setActiveTab(tabToActivate);
        // Force refresh artifacts after generation
        await checkExistingArtifacts();
      }
    } catch (err: any) {
      console.error(`Error generating ${type}:`, err);
      setError(err.message || `Failed to generate ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const openTicketInJira = () => {
    if (!ticket || !ticket.domain) return;
    
    const url = `${ticket.domain}/browse/${ticket.key}`;
    window.open(url, '_blank');
  };

  // Wrapper function for pushToJira to match the expected signature in ContentDisplay
  const handlePushToJira = (content: string) => {
    if (!ticket || !ticket.key) return Promise.resolve(false);
    return pushToJira(ticket.key, content);
  };

  if (!ticket) {
    return <StoryDetailEmpty />;
  }

  return (
    <div className="space-y-4">
      <Card className="w-full h-fit">
        <CardHeader>
          <StoryHeader 
            ticket={ticket}
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
              <TabsTrigger value="lld" disabled={!isLldGenerated && !loading}>LLD</TabsTrigger>
              <TabsTrigger value="code" disabled={!isCodeGenerated && !loading}>Code</TabsTrigger>
              <TabsTrigger value="tests" disabled={!isTestsGenerated && !loading}>Tests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <StoryOverview
                ticket={ticket}
                loading={loading}
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
              loading={loading}
              ticket={ticket}
              onPushToJira={handlePushToJira}
              projectContext={projectContext}
              selectedDocuments={selectedDocuments}
            />
            
            <StoryTabContent 
              tabId="code"
              title="Implementation Code"
              content={codeContent}
              contentType="code"
              loading={loading}
              ticket={ticket}
              onPushToJira={handlePushToJira}
              projectContext={projectContext}
              selectedDocuments={selectedDocuments}
            />
            
            <StoryTabContent 
              tabId="tests"
              title="Test Cases"
              content={testContent}
              contentType="tests"
              loading={loading}
              ticket={ticket}
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

export default StoryDetail;
