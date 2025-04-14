
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Code, FileText, TestTube, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { JiraTicket, ProjectContextData, JiraGenerationRequest } from '@/types/jira';
import { useStories } from '@/contexts/StoriesContext';
import StoryTabContent from './StoryTabContent';
import { useJiraArtifacts } from '@/hooks/useJiraArtifacts';

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
  const [generating, setGenerating] = useState<string | null>(null); // Type being generated
  
  const { generateContent, pushToJira } = useStories();
  const { 
    lldContent, 
    codeContent, 
    testContent, 
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
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Generate Content</span>
          <div className="flex items-center space-x-2">
            <Button 
              variant={lldContent ? "outline" : "default"} 
              size="sm" 
              onClick={handleGenerateLLD}
              disabled={generating !== null}
              className="flex items-center"
            >
              {generating === "lld" ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {lldContent ? 'Regenerate LLD' : 'Generate LLD'}
            </Button>
            
            <Button 
              variant={codeContent ? "outline" : "default"} 
              size="sm" 
              onClick={handleGenerateCode}
              disabled={generating !== null}
              className="flex items-center"
            >
              {generating === "code" ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Code className="h-4 w-4 mr-2" />
              )}
              {codeContent ? 'Regenerate Code' : 'Generate Code'}
            </Button>
            
            <Button 
              variant={testContent ? "outline" : "default"} 
              size="sm" 
              onClick={handleGenerateTests}
              disabled={generating !== null}
              className="flex items-center"
            >
              {generating === "tests" ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              {testContent ? 'Regenerate Tests' : 'Generate Tests'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="lld" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span>LLD</span>
              {lldContent && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              <span>Code</span>
              {codeContent && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center">
              <TestTube className="h-4 w-4 mr-2" />
              <span>Tests</span>
              {testContent && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
            </TabsTrigger>
          </TabsList>
          
          <StoryTabContent
            tabId="lld"
            title="Low-Level Design"
            content={lldContent}
            contentType="lld"
            loading={generating === "lld"}
            ticket={ticket}
            projectContext={projectContext}
            selectedDocuments={selectedDocuments}
            onPushToJira={handlePushToJira}
          />
          
          <StoryTabContent
            tabId="code"
            title="Implementation Code"
            content={codeContent}
            contentType="code"
            loading={generating === "code"}
            ticket={ticket}
            projectContext={projectContext}
            selectedDocuments={selectedDocuments}
            onPushToJira={handlePushToJira}
          />
          
          <StoryTabContent
            tabId="tests"
            title="Test Cases"
            content={testContent}
            contentType="tests"
            loading={generating === "tests"}
            ticket={ticket}
            projectContext={projectContext}
            selectedDocuments={selectedDocuments}
            onPushToJira={handlePushToJira}
          />
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StoryGenerateContent;
