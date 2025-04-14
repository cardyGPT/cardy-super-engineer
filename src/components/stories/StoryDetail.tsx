
import React, { useState } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { JiraTicket, ProjectContextData } from '@/types/jira';
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CalendarClock, Check, Clock, ExternalLink, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sanitizeContentForReact, ensureString } from '@/contexts/stories/api';
import StoryGenerateContent from './StoryGenerateContent';

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
  
  if (isLoading) {
    return <StoryDetailSkeleton />;
  }

  return (
    <div className="space-y-6">
      <StoryHeader ticket={ticket} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="details">Story Details</TabsTrigger>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="py-4">
          <StoryContent ticket={ticket} />
        </TabsContent>
        
        <TabsContent value="generate" className="py-4">
          <StoryGenerateContent 
            ticket={ticket}
            projectContext={projectContext}
            selectedDocuments={selectedDocuments}
            projectContextData={projectContextData}
            onGenerate={generateContent}
            onPushToJira={pushToJira}
            generatedContent={generatedContent}
            isGenerating={contentLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StoryHeader: React.FC<{ ticket: JiraTicket }> = ({ ticket }) => {
  const getJiraTicketUrl = () => {
    if (!ticket.domain || !ticket.key) return '#';
    return `${ticket.domain}/browse/${ticket.key}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-primary">
            {ticket.key}
          </h3>
          {ticket.issuetype?.name && (
            <Badge variant="outline">
              {ticket.issuetype.name}
            </Badge>
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
        {ticket.status && (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            {ticket.status}
          </Badge>
        )}
        
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
        {ticket.assignee && (
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {ticket.assignee}
          </div>
        )}
        
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
      {fixedDescription ? (
        <div className="space-y-2">
          <h3 className="text-md font-semibold flex items-center">
            <Check className="h-4 w-4 mr-2 text-green-500" />
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
      
      {fixedAcceptanceCriteria ? (
        <div className="space-y-2">
          <h3 className="text-md font-semibold flex items-center">
            <Check className="h-4 w-4 mr-2 text-green-500" />
            Acceptance Criteria
          </h3>
          <div className={`text-sm bg-muted/50 p-4 rounded-md ${isAcceptanceCriteriaJson ? 'font-mono overflow-x-auto' : 'whitespace-pre-wrap'}`}>
            {fixedAcceptanceCriteria}
          </div>
        </div>
      ) : null}
      
      {ticket.labels && ticket.labels.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-md font-semibold">Labels</h3>
          <div className="flex flex-wrap gap-2">
            {ticket.labels.map((label, index) => (
              <Badge key={index} variant="outline">{label}</Badge>
            ))}
          </div>
        </div>
      )}
      
      {ticket.epicInfo && (
        <div className="space-y-2">
          <h3 className="text-md font-semibold">Epic</h3>
          <div className="text-sm bg-muted/50 p-4 rounded-md">
            {typeof ticket.epicInfo === 'object' 
              ? JSON.stringify(ticket.epicInfo, null, 2)
              : ticket.epicInfo}
          </div>
        </div>
      )}
    </div>
  );
};

const StoryDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
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
      
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
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
