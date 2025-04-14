
import React, { useState } from 'react';
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse, ProjectContextData } from '@/types/jira';
import { useStories } from '@/contexts/StoriesContext';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Code, TestTube, FileCheck, Copy, BookOpen, MessageSquare, FileText, 
         Download, Cloud, GitBranch, FileOutput } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Markdown from 'react-markdown';
import { pushContentToJira, pushContentToGDrive, pushContentToBitbucket, generatePDF } from '@/contexts/stories/api/contentApi';
import LoadingContent from './LoadingContent';

interface StoryGenerateContentProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryGenerateContent: React.FC<StoryGenerateContentProps> = ({
  ticket,
  projectContext,
  selectedDocuments = []
}) => {
  const { generateContent, credentials, contentLoading, pushToJira } = useStories();
  const [tab, setTab] = useState('lld');
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse>({});
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [isPushing, setIsPushing] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  
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
  
  const handleCopyContent = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setIsCopied(prev => ({ ...prev, [type]: true }));
    
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard',
    });
    
    setTimeout(() => {
      setIsCopied(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };
  
  const handlePushToJira = async (content: string, type: string) => {
    if (!credentials || !ticket.key) {
      toast({
        title: 'Error',
        description: 'Missing credentials or ticket key',
        variant: 'destructive'
      });
      return;
    }
    
    const pushType = `jira-${type}`;
    setIsPushing(prev => ({ ...prev, [pushType]: true }));
    
    try {
      await pushToJira(ticket.key, content);
      toast({
        title: 'Success',
        description: `Content pushed to Jira ticket ${ticket.key}`,
      });
    } catch (err: any) {
      console.error('Error pushing to Jira:', err);
      toast({
        title: 'Push Failed',
        description: err.message || 'Failed to push content to Jira',
        variant: 'destructive'
      });
    } finally {
      setIsPushing(prev => ({ ...prev, [pushType]: false }));
    }
  };
  
  const handlePushToGDrive = async (content: string, type: string) => {
    if (!ticket.key) {
      toast({
        title: 'Error',
        description: 'Missing ticket key',
        variant: 'destructive'
      });
      return;
    }
    
    const pushType = `gdrive-${type}`;
    setIsPushing(prev => ({ ...prev, [pushType]: true }));
    
    try {
      await pushContentToGDrive(ticket.key, content, type);
      toast({
        title: 'Success',
        description: `Content pushed to Google Drive`,
      });
    } catch (err: any) {
      console.error('Error pushing to Google Drive:', err);
      toast({
        title: 'Push Failed',
        description: err.message || 'Failed to push content to Google Drive',
        variant: 'destructive'
      });
    } finally {
      setIsPushing(prev => ({ ...prev, [pushType]: false }));
    }
  };
  
  const handlePushToBitbucket = async (content: string, type: string) => {
    if (!ticket.key) {
      toast({
        title: 'Error',
        description: 'Missing ticket key',
        variant: 'destructive'
      });
      return;
    }
    
    const pushType = `bitbucket-${type}`;
    setIsPushing(prev => ({ ...prev, [pushType]: true }));
    
    try {
      await pushContentToBitbucket(ticket.key, content, type);
      toast({
        title: 'Success',
        description: `Content pushed to Bitbucket`,
      });
    } catch (err: any) {
      console.error('Error pushing to Bitbucket:', err);
      toast({
        title: 'Push Failed',
        description: err.message || 'Failed to push content to Bitbucket',
        variant: 'destructive'
      });
    } finally {
      setIsPushing(prev => ({ ...prev, [pushType]: false }));
    }
  };
  
  const handleDownloadPDF = async (content: string, type: string) => {
    if (!ticket.key) {
      toast({
        title: 'Error',
        description: 'Missing ticket key',
        variant: 'destructive'
      });
      return;
    }
    
    const pushType = `pdf-${type}`;
    setIsPushing(prev => ({ ...prev, [pushType]: true }));
    
    try {
      const pdfUrl = await generatePDF(ticket.key, content, type);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${ticket.key}-${type}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: `PDF downloaded`,
      });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      toast({
        title: 'PDF Generation Failed',
        description: err.message || 'Failed to generate PDF',
        variant: 'destructive'
      });
    } finally {
      setIsPushing(prev => ({ ...prev, [pushType]: false }));
    }
  };
  
  const renderContent = (content: string | undefined) => {
    if (!content) return null;
    return (
      <ScrollArea className="h-[60vh] w-full rounded border p-4">
        <Markdown>{content}</Markdown>
      </ScrollArea>
    );
  };
  
  const getButtonColor = (type: string) => {
    switch (type) {
      case 'lld':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'code':
        return 'bg-green-500 hover:bg-green-600';
      case 'tests':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'test_cases':
        return 'bg-amber-500 hover:bg-amber-600';
      default:
        return '';
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            onClick={() => generateContentForType('lld')}
            disabled={isGenerating.lld || contentLoading}
            className={getButtonColor('lld')}
          >
            {isGenerating.lld ? (
              <LoadingContent small isLoading={true} inline />
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Generate LLD
              </>
            )}
          </Button>
          
          <Button
            onClick={() => generateContentForType('code')}
            disabled={isGenerating.code || contentLoading}
            className={getButtonColor('code')}
          >
            {isGenerating.code ? (
              <LoadingContent small isLoading={true} inline />
            ) : (
              <>
                <Code className="mr-2 h-4 w-4" />
                Generate Code
              </>
            )}
          </Button>
          
          <Button
            onClick={() => generateContentForType('tests')}
            disabled={isGenerating.tests || contentLoading}
            className={getButtonColor('tests')}
          >
            {isGenerating.tests ? (
              <LoadingContent small isLoading={true} inline />
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Generate Tests
              </>
            )}
          </Button>
          
          <Button
            onClick={() => generateContentForType('test_cases')}
            disabled={isGenerating.test_cases || contentLoading}
            className={getButtonColor('test_cases')}
          >
            {isGenerating.test_cases ? (
              <LoadingContent small isLoading={true} inline />
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Generate Test Cases
              </>
            )}
          </Button>
        </div>
        
        {Object.keys(generatedContent).length > 0 ? (
          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="lld" disabled={!generatedContent.lld}>LLD</TabsTrigger>
              <TabsTrigger value="code" disabled={!generatedContent.code}>Code</TabsTrigger>
              <TabsTrigger value="tests" disabled={!generatedContent.tests}>Tests</TabsTrigger>
              <TabsTrigger value="test_cases" disabled={!generatedContent.testCases}>Test Cases</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lld" className="space-y-4 pt-4">
              {generatedContent.lld ? (
                <>
                  {renderContent(generatedContent.lld)}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyContent(generatedContent.lld || '', 'lld')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {isCopied.lld ? 'Copied!' : 'Copy'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToJira(generatedContent.lld || '', 'lld')}
                      disabled={isPushing['jira-lld']}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isPushing['jira-lld'] ? 'Pushing...' : 'Push to Jira'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToGDrive(generatedContent.lld || '', 'lld')}
                      disabled={isPushing['gdrive-lld']}
                    >
                      <Cloud className="mr-2 h-4 w-4" />
                      {isPushing['gdrive-lld'] ? 'Pushing...' : 'Push to Drive'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToBitbucket(generatedContent.lld || '', 'lld')}
                      disabled={isPushing['bitbucket-lld']}
                    >
                      <GitBranch className="mr-2 h-4 w-4" />
                      {isPushing['bitbucket-lld'] ? 'Pushing...' : 'Push to Bitbucket'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(generatedContent.lld || '', 'lld')}
                      disabled={isPushing['pdf-lld']}
                    >
                      <FileOutput className="mr-2 h-4 w-4" />
                      {isPushing['pdf-lld'] ? 'Generating...' : 'Download as PDF'}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>No LLD content</AlertTitle>
                  <AlertDescription>
                    Generate LLD content to see it here.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4 pt-4">
              {generatedContent.code ? (
                <>
                  {renderContent(generatedContent.code)}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyContent(generatedContent.code || '', 'code')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {isCopied.code ? 'Copied!' : 'Copy'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToJira(generatedContent.code || '', 'code')}
                      disabled={isPushing['jira-code']}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isPushing['jira-code'] ? 'Pushing...' : 'Push to Jira'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToGDrive(generatedContent.code || '', 'code')}
                      disabled={isPushing['gdrive-code']}
                    >
                      <Cloud className="mr-2 h-4 w-4" />
                      {isPushing['gdrive-code'] ? 'Pushing...' : 'Push to Drive'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToBitbucket(generatedContent.code || '', 'code')}
                      disabled={isPushing['bitbucket-code']}
                    >
                      <GitBranch className="mr-2 h-4 w-4" />
                      {isPushing['bitbucket-code'] ? 'Pushing...' : 'Push to Bitbucket'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(generatedContent.code || '', 'code')}
                      disabled={isPushing['pdf-code']}
                    >
                      <FileOutput className="mr-2 h-4 w-4" />
                      {isPushing['pdf-code'] ? 'Generating...' : 'Download as PDF'}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert>
                  <Code className="h-4 w-4" />
                  <AlertTitle>No code content</AlertTitle>
                  <AlertDescription>
                    Generate code content to see it here.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="tests" className="space-y-4 pt-4">
              {generatedContent.tests ? (
                <>
                  {renderContent(generatedContent.tests)}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyContent(generatedContent.tests || '', 'tests')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {isCopied.tests ? 'Copied!' : 'Copy'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToJira(generatedContent.tests || '', 'tests')}
                      disabled={isPushing['jira-tests']}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isPushing['jira-tests'] ? 'Pushing...' : 'Push to Jira'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToGDrive(generatedContent.tests || '', 'tests')}
                      disabled={isPushing['gdrive-tests']}
                    >
                      <Cloud className="mr-2 h-4 w-4" />
                      {isPushing['gdrive-tests'] ? 'Pushing...' : 'Push to Drive'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToBitbucket(generatedContent.tests || '', 'tests')}
                      disabled={isPushing['bitbucket-tests']}
                    >
                      <GitBranch className="mr-2 h-4 w-4" />
                      {isPushing['bitbucket-tests'] ? 'Pushing...' : 'Push to Bitbucket'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(generatedContent.tests || '', 'tests')}
                      disabled={isPushing['pdf-tests']}
                    >
                      <FileOutput className="mr-2 h-4 w-4" />
                      {isPushing['pdf-tests'] ? 'Generating...' : 'Download as PDF'}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert>
                  <TestTube className="h-4 w-4" />
                  <AlertTitle>No tests content</AlertTitle>
                  <AlertDescription>
                    Generate tests content to see it here.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="test_cases" className="space-y-4 pt-4">
              {generatedContent.testCases ? (
                <>
                  {renderContent(generatedContent.testCases)}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyContent(generatedContent.testCases || '', 'test_cases')}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {isCopied.test_cases ? 'Copied!' : 'Copy'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToJira(generatedContent.testCases || '', 'test_cases')}
                      disabled={isPushing['jira-test_cases']}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isPushing['jira-test_cases'] ? 'Pushing...' : 'Push to Jira'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToGDrive(generatedContent.testCases || '', 'test_cases')}
                      disabled={isPushing['gdrive-test_cases']}
                    >
                      <Cloud className="mr-2 h-4 w-4" />
                      {isPushing['gdrive-test_cases'] ? 'Pushing...' : 'Push to Drive'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePushToBitbucket(generatedContent.testCases || '', 'test_cases')}
                      disabled={isPushing['bitbucket-test_cases']}
                    >
                      <GitBranch className="mr-2 h-4 w-4" />
                      {isPushing['bitbucket-test_cases'] ? 'Pushing...' : 'Push to Bitbucket'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(generatedContent.testCases || '', 'test_cases')}
                      disabled={isPushing['pdf-test_cases']}
                    >
                      <FileOutput className="mr-2 h-4 w-4" />
                      {isPushing['pdf-test_cases'] ? 'Generating...' : 'Download as PDF'}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert>
                  <FileCheck className="h-4 w-4" />
                  <AlertTitle>No test cases content</AlertTitle>
                  <AlertDescription>
                    Generate test cases content to see it here.
                  </AlertDescription>
                </Alert>
              )}
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
