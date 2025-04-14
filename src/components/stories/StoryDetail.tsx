
import React, { useState } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { JiraTicket, ProjectContextData } from '@/types/jira';
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CalendarClock, 
  Check, 
  Clock, 
  ExternalLink, 
  User, 
  Tags, 
  FileText, 
  Code, 
  TestTube, 
  Send, 
  Github, 
  FileDown,
  FileText as DocumentIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { sanitizeContentForReact, ensureString } from '@/contexts/stories/api';
import StoryTabContent from './StoryTabContent';
import { useJiraArtifacts } from '@/hooks/useJiraArtifacts';

interface StoryDetailProps {
  ticket: JiraTicket;
  isLoading?: boolean;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryDetail: React.FC<StoryDetailProps> = ({ 
  ticket, 
  isLoading = false,
  projectContext = null,
  selectedDocuments = [],
  projectContextData = null
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const { generateContent, pushToJira, generatedContent, contentLoading } = useStories();
  const { isLldGenerated, isCodeGenerated, isTestsGenerated } = useJiraArtifacts(ticket);
  
  if (isLoading) {
    return <StoryDetailSkeleton />;
  }

  const handleGenerateLLD = async () => {
    try {
      await generateContent({
        type: 'lld',
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
      });
      setActiveTab("generate");
    } catch (error) {
      console.error("Error generating LLD:", error);
    }
  };

  const handleGenerateCode = async () => {
    try {
      await generateContent({
        type: 'code',
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
      });
      setActiveTab("generate");
    } catch (error) {
      console.error("Error generating code:", error);
    }
  };

  const handleGenerateTests = async () => {
    try {
      await generateContent({
        type: 'tests',
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
      });
      setActiveTab("generate");
    } catch (error) {
      console.error("Error generating tests:", error);
    }
  };

  const handlePushToJira = async (content: string) => {
    if (!ticket.id) return false;
    return await pushToJira(ticket.id, content);
  };

  const getJiraTicketUrl = () => {
    if (!ticket.domain || !ticket.key) return '#';
    return `${ticket.domain}/browse/${ticket.key}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Ticket Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-primary">
                {ticket.key}
              </h3>
              {ticket.issuetype?.name && (
                <Badge variant="outline" className="capitalize">
                  {ticket.issuetype.name}
                </Badge>
              )}
              {ticket.status && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {ticket.status}
                </Badge>
              )}
              {ticket.assignee && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5 mr-1" />
                  {ticket.assignee}
                </div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open(getJiraTicketUrl(), '_blank')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View in Jira
            </Button>
          </div>
          
          <h2 className="text-2xl font-bold">
            {ticket.summary}
          </h2>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {ticket.priority && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Priority: {ticket.priority}
              </Badge>
            )}
            
            {ticket.story_points > 0 && (
              <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
                {ticket.story_points} points
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {ticket.created_at && (
              <div className="flex items-center">
                <CalendarClock className="h-4 w-4 mr-1" />
                Created: {new Date(ticket.created_at).toLocaleDateString()}
              </div>
            )}
            
            {ticket.updated_at && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Updated: {new Date(ticket.updated_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <TabsList className="w-full justify-start h-12 bg-transparent p-0 rounded-none">
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary data-[state=active]:border-b-2 rounded-none h-12 px-6"
            >
              Story Details
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary data-[state=active]:border-b-2 rounded-none h-12 px-6"
            >
              Generate Content
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="details" className="py-6">
          <StoryContent ticket={ticket} />
        </TabsContent>
        
        <TabsContent value="generate" className="py-6">
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0 md:gap-4">
                <div className="col-span-1 border-r border-border p-6 bg-muted/30">
                  <div className="space-y-5">
                    <h3 className="text-base font-medium">Generate Artifacts</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start h-12 font-normal w-full"
                        onClick={handleGenerateLLD}
                        disabled={contentLoading}
                      >
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded-md mr-2.5">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        Generate LLD
                        {isLldGenerated && <Check className="ml-auto h-4 w-4 text-green-500" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start h-12 font-normal w-full"
                        onClick={handleGenerateCode}
                        disabled={contentLoading}
                      >
                        <div className="bg-green-100 dark:bg-green-900/40 p-1.5 rounded-md mr-2.5">
                          <Code className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        Generate Code
                        {isCodeGenerated && <Check className="ml-auto h-4 w-4 text-green-500" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start h-12 font-normal w-full"
                        onClick={handleGenerateTests}
                        disabled={contentLoading}
                      >
                        <div className="bg-purple-100 dark:bg-purple-900/40 p-1.5 rounded-md mr-2.5">
                          <TestTube className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        Generate Tests
                        {isTestsGenerated && <Check className="ml-auto h-4 w-4 text-green-500" />}
                      </Button>
                      
                      <Button
                        variant="default"
                        size="sm"
                        className="justify-start h-12 w-full mt-2 bg-primary/90 hover:bg-primary"
                        disabled={contentLoading}
                        onClick={async () => {
                          await handleGenerateLLD();
                          await handleGenerateCode();
                          await handleGenerateTests();
                        }}
                      >
                        <div className="bg-white/20 p-1.5 rounded-md mr-2.5">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        Generate All
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-4 p-6">
                  <StoryTabContent 
                    onGenerate={handleGenerateLLD}
                    onPushToJira={handlePushToJira}
                    projectContext={projectContext}
                    selectedDocuments={selectedDocuments}
                    ticket={ticket}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StoryContent: React.FC<{ ticket: JiraTicket }> = ({ ticket }) => {
  const fixedDescription = ticket.description ? sanitizeContentForReact(ticket.description) : '';
  const fixedAcceptanceCriteria = ticket.acceptance_criteria ? sanitizeContentForReact(ticket.acceptance_criteria) : '';
  
  // Detect if the content looks like JSON for rendering purposes
  const isDescriptionJson = fixedDescription.trim().startsWith('{') || fixedDescription.trim().startsWith('[');
  const isAcceptanceCriteriaJson = fixedAcceptanceCriteria.trim().startsWith('{') || fixedAcceptanceCriteria.trim().startsWith('[');
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {fixedDescription ? (
          <div className="space-y-3">
            <h3 className="text-md font-semibold flex items-center">
              <DocumentIcon className="h-4 w-4 mr-2 text-primary" />
              Description
            </h3>
            <div className={`text-sm bg-muted/50 p-4 rounded-md ${isDescriptionJson ? 'font-mono overflow-x-auto' : 'whitespace-pre-wrap'}`}>
              {fixedDescription}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-md font-semibold flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              Description
            </h3>
            <div className="text-sm text-muted-foreground italic">
              No description provided
            </div>
          </div>
        )}
      </div>
      
      {fixedAcceptanceCriteria && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-3">
            <h3 className="text-md font-semibold flex items-center">
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Acceptance Criteria
            </h3>
            <div className={`text-sm bg-muted/50 p-4 rounded-md ${isAcceptanceCriteriaJson ? 'font-mono overflow-x-auto' : 'whitespace-pre-wrap'}`}>
              {fixedAcceptanceCriteria}
            </div>
          </div>
        </div>
      )}
      
      {ticket.labels && ticket.labels.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-3">
            <h3 className="text-md font-semibold flex items-center">
              <Tags className="h-4 w-4 mr-2 text-blue-500" />
              Labels
            </h3>
            <div className="flex flex-wrap gap-2">
              {ticket.labels.map((label, index) => (
                <Badge key={index} variant="outline">{label}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {ticket.epicInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-3">
            <h3 className="text-md font-semibold flex items-center">
              <DocumentIcon className="h-4 w-4 mr-2 text-primary" />
              Epic
            </h3>
            <div className="text-sm bg-muted/50 p-4 rounded-md">
              {typeof ticket.epicInfo === 'object' 
                ? JSON.stringify(ticket.epicInfo, null, 2)
                : ticket.epicInfo}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StoryDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-8 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
};

export default StoryDetail;
