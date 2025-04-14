
import React, { useState } from 'react';
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse, ProjectContextData } from '@/types/jira';
import { useStories } from '@/contexts/StoriesContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileDown } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import GenerateButtons from './GenerateButtons';
import ContentView from './ContentView';
import { useContentGenerationActions } from './hooks/useContentGeneration';

export interface StoryGenerateContentProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryGenerateContent: React.FC<StoryGenerateContentProps> = ({
  ticket,
  projectContext,
  selectedDocuments = [],
  projectContextData = null
}) => {
  const { generateContent, credentials, contentLoading } = useStories();
  const [tab, setTab] = useState('lld');
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const {
    isCopied,
    isPushing,
    handleCopyContent,
    handlePushToJira,
    handlePushToGDrive,
    handlePushToBitbucket,
    handleDownloadPDF
  } = useContentGenerationActions(ticket);
  
  const generateContentForType = async (type: 'lld' | 'code' | 'tests' | 'test_cases' | 'all') => {
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    
    try {
      const request: JiraGenerationRequest = {
        type,
        jiraTicket: ticket,
        projectContext,
        selectedDocuments,
      };
      
      console.log(`Generating ${type} content with request:`, request);
      
      const response = await generateContent(request);
      if (response) {
        setGeneratedContent(prev => ({ ...prev, ...response }));
        setTab(type);
        
        toast({
          title: 'Content Generated',
          description: `Successfully generated ${type} content`,
        });
      }
    } catch (err: any) {
      console.error(`Error generating ${type} content:`, err);
      toast({
        title: 'Generation Failed',
        description: err.message || `Failed to generate ${type} content`,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Content</CardTitle>
        <CardDescription>
          Generate various types of content for this ticket using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenerateButtons 
          onGenerate={generateContentForType}
          isGenerating={isGenerating}
          contentLoading={contentLoading}
        />
        
        {Object.keys(generatedContent).length > 0 ? (
          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="lld" disabled={!generatedContent.lld}>LLD</TabsTrigger>
              <TabsTrigger value="code" disabled={!generatedContent.code}>Code</TabsTrigger>
              <TabsTrigger value="tests" disabled={!generatedContent.tests}>Tests</TabsTrigger>
              <TabsTrigger value="test_cases" disabled={!generatedContent.testCases}>Test Cases</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lld" className="space-y-4 pt-4">
              <ContentView
                content={generatedContent.lld}
                contentType="lld"
                isCopied={isCopied}
                isPushing={isPushing}
                onCopy={handleCopyContent}
                onPushToJira={handlePushToJira}
                onPushToGDrive={handlePushToGDrive}
                onPushToBitbucket={handlePushToBitbucket}
                onDownloadPDF={handleDownloadPDF}
              />
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4 pt-4">
              <ContentView
                content={generatedContent.code}
                contentType="code"
                isCopied={isCopied}
                isPushing={isPushing}
                onCopy={handleCopyContent}
                onPushToJira={handlePushToJira}
                onPushToGDrive={handlePushToGDrive}
                onPushToBitbucket={handlePushToBitbucket}
                onDownloadPDF={handleDownloadPDF}
              />
            </TabsContent>
            
            <TabsContent value="tests" className="space-y-4 pt-4">
              <ContentView
                content={generatedContent.tests}
                contentType="tests"
                isCopied={isCopied}
                isPushing={isPushing}
                onCopy={handleCopyContent}
                onPushToJira={handlePushToJira}
                onPushToGDrive={handlePushToGDrive}
                onPushToBitbucket={handlePushToBitbucket}
                onDownloadPDF={handleDownloadPDF}
              />
            </TabsContent>
            
            <TabsContent value="test_cases" className="space-y-4 pt-4">
              <ContentView
                content={generatedContent.testCases}
                contentType="test_cases"
                isCopied={isCopied}
                isPushing={isPushing}
                onCopy={handleCopyContent}
                onPushToJira={handlePushToJira}
                onPushToGDrive={handlePushToGDrive}
                onPushToBitbucket={handlePushToBitbucket}
                onDownloadPDF={handleDownloadPDF}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Alert className="mt-4">
            <FileDown className="h-4 w-4" />
            <AlertTitle>No content generated yet</AlertTitle>
            <AlertDescription>
              Use the buttons above to generate content for this ticket.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StoryGenerateContent;
