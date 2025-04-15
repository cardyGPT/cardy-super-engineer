
import React, { useState, useEffect } from 'react';
import { JiraTicket, JiraGenerationRequest, ProjectContextData } from '@/types/jira';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStories } from '@/contexts/StoriesContext';
import StoryHeader from './StoryHeader';
import StoryGenerateContent from './generate-content/StoryGenerateContent';
import StoryOverview from './StoryOverview';
import { useJiraArtifacts } from '@/hooks/useJiraArtifacts';

interface StoryDetailProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryDetail: React.FC<StoryDetailProps> = ({ 
  ticket, 
  projectContext,
  selectedDocuments,
  projectContextData
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);
  const { generateContent, pushToJira, contentLoading, generatedContent } = useStories();
  
  // Fetch existing artifacts for this ticket
  const { 
    lldContent, 
    codeContent, 
    testContent, 
    testCasesContent,
    isLldGenerated,
    isCodeGenerated,
    isTestsGenerated,
    isTestCasesGenerated,
    loading: artifactsLoading,
    error: artifactsError,
    refreshArtifacts
  } = useJiraArtifacts(ticket);
  
  // If there's an error fetching artifacts, set it
  useEffect(() => {
    if (artifactsError) {
      setError(artifactsError);
    }
  }, [artifactsError]);
  
  const existingArtifacts = {
    lldContent,
    codeContent,
    testContent,
    testCasesContent
  };
  
  const handleGenerateLLD = async () => {
    setActiveTab('generate');
    const request: JiraGenerationRequest = {
      type: 'lld',
      jiraTicket: ticket,
      projectContext: projectContext || undefined,
      selectedDocuments: selectedDocuments || []
    };
    
    await generateContent(request);
    refreshArtifacts(); // Refresh artifacts after generation
  };
  
  const handleGenerateCode = async () => {
    setActiveTab('generate');
    const request: JiraGenerationRequest = {
      type: 'code',
      jiraTicket: ticket,
      projectContext: projectContext || undefined,
      selectedDocuments: selectedDocuments || [],
      additionalContext: {
        lldContent: lldContent || generatedContent?.lldContent
      }
    };
    
    await generateContent(request);
    refreshArtifacts(); // Refresh artifacts after generation
  };
  
  const handleGenerateTests = async () => {
    setActiveTab('generate');
    const request: JiraGenerationRequest = {
      type: 'tests',
      jiraTicket: ticket,
      projectContext: projectContext || undefined,
      selectedDocuments: selectedDocuments || [],
      additionalContext: {
        lldContent: lldContent || generatedContent?.lldContent,
        codeContent: codeContent || generatedContent?.codeContent
      }
    };
    
    await generateContent(request);
    refreshArtifacts(); // Refresh artifacts after generation
  };
  
  const handleGenerateAll = async () => {
    setActiveTab('generate');
    
    // First generate LLD
    const lldRequest: JiraGenerationRequest = {
      type: 'lld',
      jiraTicket: ticket,
      projectContext: projectContext || undefined,
      selectedDocuments: selectedDocuments || []
    };
    
    await generateContent(lldRequest);
    
    // Then generate code
    const codeRequest: JiraGenerationRequest = {
      type: 'code',
      jiraTicket: ticket,
      projectContext: projectContext || undefined,
      selectedDocuments: selectedDocuments || [],
      additionalContext: {
        lldContent: generatedContent?.lldContent
      }
    };
    
    await generateContent(codeRequest);
    
    // Then generate test cases
    const testCasesRequest: JiraGenerationRequest = {
      type: 'testcases',
      jiraTicket: ticket,
      projectContext: projectContext || undefined,
      selectedDocuments: selectedDocuments || [],
      additionalContext: {
        lldContent: generatedContent?.lldContent,
        codeContent: generatedContent?.codeContent
      }
    };
    
    await generateContent(testCasesRequest);
    
    // Finally generate tests
    const testsRequest: JiraGenerationRequest = {
      type: 'tests',
      jiraTicket: ticket,
      projectContext: projectContext || undefined,
      selectedDocuments: selectedDocuments || [],
      additionalContext: {
        lldContent: generatedContent?.lldContent,
        codeContent: generatedContent?.codeContent,
        testCasesContent: generatedContent?.testCasesContent
      }
    };
    
    await generateContent(testsRequest);
    refreshArtifacts(); // Refresh artifacts after all generations
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <StoryHeader ticket={ticket} />
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6">
            <TabsContent value="overview" className="m-0">
              <StoryOverview 
                ticket={ticket}
                loading={contentLoading || artifactsLoading}
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
            
            <TabsContent value="generate" className="m-0">
              <StoryGenerateContent 
                ticket={ticket}
                projectContext={projectContext}
                selectedDocuments={selectedDocuments}
                projectContextData={projectContextData}
                onGenerate={generateContent}
                onPushToJira={pushToJira}
                generatedContent={generatedContent}
                isGenerating={contentLoading}
                existingArtifacts={existingArtifacts}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StoryDetail;
