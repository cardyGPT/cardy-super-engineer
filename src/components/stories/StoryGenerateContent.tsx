
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Code, FileText, TestTube, RefreshCw, Send, CheckCircle2, Download, Github, FileSpreadsheet, BookOpenText, Beaker } from "lucide-react";
import { JiraTicket, ProjectContextData, JiraGenerationRequest } from '@/types/jira';
import { useStories } from '@/contexts/StoriesContext';
import StoryTabContent from './StoryTabContent';
import { useJiraArtifacts } from '@/hooks/useJiraArtifacts';
import { downloadAsPDF } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StoryGenerateContentProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryGenerateContent: React.FC<StoryGenerateContentProps> = ({
  ticket,
  projectContext,
  selectedDocuments = [],
  projectContextData
}) => {
  const [activeTab, setActiveTab] = useState("lld");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const {
    generateContent,
    pushToJira
  } = useStories();
  const {
    lldContent,
    codeContent,
    testContent,
    testCasesContent,
    refreshArtifacts
  } = useJiraArtifacts(ticket);

  const handleGenerateLLD = async () => {
    if (!ticket) return;
    setError(null);
    setGenerating("lld");
    try {
      const request: JiraGenerationRequest = {
        type: 'lld',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments,
        additionalContext: {}
      };
      await generateContent(request);
      await refreshArtifacts();
      setActiveTab("lld");
    } catch (err: any) {
      setError(err.message || 'Failed to generate LLD');
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateCode = async () => {
    if (!ticket) return;
    setError(null);
    setGenerating("code");
    try {
      const request: JiraGenerationRequest = {
        type: 'code',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments,
        additionalContext: {}
      };
      await generateContent(request);
      await refreshArtifacts();
      setActiveTab("code");
    } catch (err: any) {
      setError(err.message || 'Failed to generate code');
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateTestCases = async () => {
    if (!ticket) return;
    setError(null);
    setGenerating("test_cases");
    try {
      const request: JiraGenerationRequest = {
        type: 'test_cases',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments,
        additionalContext: {}
      };
      await generateContent(request);
      await refreshArtifacts();
      setActiveTab("test_cases");
    } catch (err: any) {
      setError(err.message || 'Failed to generate test cases');
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateTests = async () => {
    if (!ticket) return;
    setError(null);
    setGenerating("tests");
    try {
      const request: JiraGenerationRequest = {
        type: 'tests',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments,
        additionalContext: {}
      };
      await generateContent(request);
      await refreshArtifacts();
      setActiveTab("tests");
    } catch (err: any) {
      setError(err.message || 'Failed to generate tests');
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!ticket) return;
    setError(null);
    setGenerating("all");
    try {
      // Generate LLD
      await generateContent({
        type: 'lld',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments,
        additionalContext: {}
      });
      
      // Generate Code
      await generateContent({
        type: 'code',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments,
        additionalContext: {}
      });
      
      // Generate Test Cases
      await generateContent({
        type: 'test_cases',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments,
        additionalContext: {}
      });
      
      // Generate Tests
      await generateContent({
        type: 'tests',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments,
        additionalContext: {}
      });
      
      await refreshArtifacts();
      toast({
        title: "Generation Complete",
        description: "All content has been generated successfully."
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate all content');
    } finally {
      setGenerating(null);
    }
  };

  const handlePushToJira = async (content: string): Promise<boolean> => {
    if (!ticket || !ticket.id) {
      setError('Invalid ticket information');
      return false;
    }
    try {
      return await pushToJira(ticket.id, content);
    } catch (err: any) {
      setError(err.message || 'Failed to push to Jira');
      return false;
    }
  };

  const handleDownloadAll = async () => {
    if (!contentRef.current) {
      toast({
        title: "Error",
        description: "Content container not found",
        variant: "destructive"
      });
      return;
    }
    const result = await downloadAsPDF(contentRef.current, `${ticket.key}_all_content`);
    if (result) {
      toast({
        title: "Download Complete",
        description: "Content has been downloaded as PDF"
      });
    } else {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const handlePushToGSuite = () => {
    toast({
      title: "GSuite Integration",
      description: "Pushing to GSuite is not fully implemented yet",
      variant: "default"
    });
  };

  const handlePushToBitbucket = () => {
    toast({
      title: "Bitbucket Integration",
      description: "Pushing to Bitbucket is not fully implemented yet",
      variant: "default"
    });
  };

  const hasAnyContent = lldContent || codeContent || testContent || testCasesContent;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleGenerateLLD} disabled={generating !== null} className="h-8 w-8">
                    {generating === "lld" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {lldContent ? 'Regenerate LLD' : 'Generate LLD'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleGenerateCode} disabled={generating !== null} className="h-8 w-8">
                    {generating === "code" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Code className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {codeContent ? 'Regenerate Code' : 'Generate Code'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleGenerateTestCases} disabled={generating !== null} className="h-8 w-8">
                    {generating === "test_cases" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Beaker className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {testCasesContent ? 'Regenerate Test Cases' : 'Generate Test Cases'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleGenerateTests} disabled={generating !== null} className="h-8 w-8">
                    {generating === "tests" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {testContent ? 'Regenerate Tests (Playwright)' : 'Generate Tests (Playwright)'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleGenerateAll} disabled={generating !== null} className="h-8 w-8">
                    {generating === "all" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BookOpenText className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Generate All
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {hasAnyContent && (
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleDownloadAll} className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Download as PDF
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handlePushToGSuite} className="h-8 w-8">
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Push to GSuite
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handlePushToBitbucket} className="h-8 w-8">
                      <Github className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Push to Bitbucket
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent ref={contentRef}>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!hasAnyContent && !generating && (
          <div className="text-center py-8 border rounded-md bg-gray-50">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium">No content generated yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Click on one of the icons above to generate content for this ticket
            </p>
          </div>
        )}
        
        {generating && (
          <div className="text-center py-16 border rounded-md">
            <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
            <h3 className="text-lg font-medium">Generating {generating === 'all' ? 'all content' : generating}...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This might take a few moments
            </p>
          </div>
        )}
        
        {hasAnyContent && !generating && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              {lldContent && <TabsTrigger value="lld">LLD</TabsTrigger>}
              {codeContent && <TabsTrigger value="code">Code</TabsTrigger>}
              {testCasesContent && <TabsTrigger value="test_cases">Test Cases</TabsTrigger>}
              {testContent && <TabsTrigger value="tests">Tests</TabsTrigger>}
            </TabsList>
            
            {lldContent && (
              <TabsContent value="lld">
                <StoryTabContent 
                  tabId="lld"
                  title="Low-Level Design"
                  content={lldContent} 
                  contentType="lld"
                  loading={false}
                  ticket={ticket}
                  onPushToJira={handlePushToJira}
                />
              </TabsContent>
            )}
            
            {codeContent && (
              <TabsContent value="code">
                <StoryTabContent 
                  tabId="code"
                  title="Code Implementation"
                  content={codeContent} 
                  contentType="code"
                  loading={false}
                  ticket={ticket}
                  onPushToJira={handlePushToJira}
                />
              </TabsContent>
            )}
            
            {testCasesContent && (
              <TabsContent value="test_cases">
                <StoryTabContent 
                  tabId="test_cases"
                  title="Test Cases"
                  content={testCasesContent} 
                  contentType="tests"
                  loading={false}
                  ticket={ticket}
                  onPushToJira={handlePushToJira}
                />
              </TabsContent>
            )}
            
            {testContent && (
              <TabsContent value="tests">
                <StoryTabContent 
                  tabId="tests"
                  title="Tests (Playwright)"
                  content={testContent} 
                  contentType="tests"
                  loading={false}
                  ticket={ticket}
                  onPushToJira={handlePushToJira}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default StoryGenerateContent;
