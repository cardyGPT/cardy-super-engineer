
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
  const [lldContent, setLldContent] = useState<string | null>(null);
  const [codeContent, setCodeContent] = useState<string | null>(null);
  const [testContent, setTestContent] = useState<string | null>(null);
  const [isLldGenerated, setIsLldGenerated] = useState<boolean>(false);
  const [isCodeGenerated, setIsCodeGenerated] = useState<boolean>(false);
  const [isTestsGenerated, setIsTestsGenerated] = useState<boolean>(false);

  // Check if artifacts already exist when ticket changes
  useEffect(() => {
    if (ticket) {
      checkExistingArtifacts();
    } else {
      // Reset state when no ticket selected
      setLldContent(null);
      setCodeContent(null);
      setTestContent(null);
      setIsLldGenerated(false);
      setIsCodeGenerated(false);
      setIsTestsGenerated(false);
    }
  }, [ticket]);

  const checkExistingArtifacts = async () => {
    if (!ticket) return;

    try {
      const { data, error } = await supabase
        .from('story_artifacts')
        .select('*')
        .eq('story_id', ticket.key)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing artifacts:', error);
        return;
      }

      if (data) {
        if (data.lld_content) {
          setLldContent(data.lld_content);
          setIsLldGenerated(true);
        }
        
        if (data.code_content) {
          setCodeContent(data.code_content);
          setIsCodeGenerated(true);
        }
        
        if (data.test_content) {
          setTestContent(data.test_content);
          setIsTestsGenerated(true);
        }
      }
    } catch (err) {
      console.error('Error checking artifacts:', err);
    }
  };

  const handleGenerateLLD = async () => {
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const response = await generateContent({
        type: 'lld',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments
      });
      
      if (response && response.lld) {
        setLldContent(response.lld);
        setIsLldGenerated(true);
        setActiveTab('lld');
      }
    } catch (err: any) {
      console.error('Error generating LLD:', err);
      setError(err.message || 'Failed to generate Low Level Design');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const response = await generateContent({
        type: 'code',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments
      });
      
      if (response && response.code) {
        setCodeContent(response.code);
        setIsCodeGenerated(true);
        setActiveTab('code');
      }
    } catch (err: any) {
      console.error('Error generating code:', err);
      setError(err.message || 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTests = async () => {
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const response = await generateContent({
        type: 'tests',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments
      });
      
      if (response && response.tests) {
        setTestContent(response.tests);
        setIsTestsGenerated(true);
        setActiveTab('tests');
      }
    } catch (err: any) {
      console.error('Error generating tests:', err);
      setError(err.message || 'Failed to generate tests');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const response = await generateContent({
        type: 'all',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments
      });
      
      if (response) {
        if (response.lld) {
          setLldContent(response.lld);
          setIsLldGenerated(true);
        }
        if (response.code) {
          setCodeContent(response.code);
          setIsCodeGenerated(true);
        }
        if (response.tests) {
          setTestContent(response.tests);
          setIsTestsGenerated(true);
        }
        // If response.response exists, we'll treat it as LLD content
        if (response.response) {
          setLldContent(response.response);
          setIsLldGenerated(true);
        }
        setActiveTab('lld');
      }
    } catch (err: any) {
      console.error('Error generating all content:', err);
      setError(err.message || 'Failed to generate content');
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
            
            <TabsContent value="lld">
              {loading ? (
                <LoadingContent />
              ) : (
                <ContentDisplay
                  title="Low Level Design"
                  content={lldContent || undefined}
                  contentType="lld"
                  storyKey={ticket.key}
                  storyId={ticket.id}
                  onPushToJira={handlePushToJira}
                  projectContext={projectContext}
                  selectedDocuments={selectedDocuments}
                />
              )}
            </TabsContent>
            
            <TabsContent value="code">
              {loading ? (
                <LoadingContent />
              ) : (
                <ContentDisplay
                  title="Implementation Code"
                  content={codeContent || undefined}
                  contentType="code"
                  storyKey={ticket.key}
                  storyId={ticket.id}
                  onPushToJira={handlePushToJira}
                  projectContext={projectContext}
                  selectedDocuments={selectedDocuments}
                />
              )}
            </TabsContent>
            
            <TabsContent value="tests">
              {loading ? (
                <LoadingContent />
              ) : (
                <ContentDisplay
                  title="Test Cases"
                  content={testContent || undefined}
                  contentType="tests"
                  storyKey={ticket.key}
                  storyId={ticket.id}
                  onPushToJira={handlePushToJira}
                  projectContext={projectContext}
                  selectedDocuments={selectedDocuments}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryDetail;
