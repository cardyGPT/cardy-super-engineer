
import React, { useState, useEffect } from 'react';
import { JiraTicket, ProjectContextData } from '@/types/jira';
import { useJiraArtifacts } from '@/hooks/useJiraArtifacts';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar } from "lucide-react";
import { format } from 'date-fns';

interface StoryDetailProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const StoryDetail: React.FC<StoryDetailProps> = ({ 
  ticket, 
  projectContext, 
  selectedDocuments,
  projectContextData,
  activeTab = "details",
  setActiveTab = () => {} 
}) => {
  const { 
    generatedContent, 
    contentLoading 
  } = useStories();
  
  const { 
    refreshArtifacts,
    loading: artifactsLoading
  } = useJiraArtifacts(ticket);

  // Reset tab to details when ticket changes
  useEffect(() => {
    refreshArtifacts();
  }, [ticket.key, refreshArtifacts]);

  // Helper function for formatting dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const getTicketUrl = () => {
    if (!ticket) return '#';
    return `https://${ticket.domain || 'jira.atlassian.com'}/browse/${ticket.key}`;
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-200 text-gray-700';
    
    status = status.toLowerCase();
    if (status.includes('done') || status.includes('complete')) {
      return 'bg-green-100 text-green-800';
    } else if (status.includes('progress') || status.includes('doing')) {
      return 'bg-blue-100 text-blue-800';
    } else if (status.includes('review')) {
      return 'bg-purple-100 text-purple-800';
    } else if (status.includes('todo') || status.includes('backlog')) {
      return 'bg-gray-100 text-gray-800';
    } else if (status.includes('block')) {
      return 'bg-red-100 text-red-800';
    }
    
    return 'bg-gray-200 text-gray-700';
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-200 text-gray-700';
    
    priority = priority.toLowerCase();
    if (priority.includes('high') || priority.includes('critical')) {
      return 'bg-red-100 text-red-800';
    } else if (priority.includes('medium')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (priority.includes('low')) {
      return 'bg-green-100 text-green-800';
    }
    
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-500">{ticket.key}</span>
                {ticket.issuetype && (
                  <Badge variant="secondary">{ticket.issuetype.name}</Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 p-0" 
                  asChild
                >
                  <a href={getTicketUrl()} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                    <span className="ml-1 text-xs text-blue-600">View in Jira</span>
                  </a>
                </Button>
              </div>
              <h3 className="text-lg font-semibold">{ticket.summary}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            {ticket.status && (
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
            )}
            {ticket.priority && (
              <Badge className={getPriorityColor(ticket.priority)}>
                Priority: {ticket.priority}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            {ticket.assignee && (
              <div>
                <span className="font-medium">Assignee:</span> {ticket.assignee}
              </div>
            )}
            {ticket.created_at && (
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span className="font-medium">Created:</span> {formatDate(ticket.created_at)}
              </div>
            )}
            {ticket.updated_at && (
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span className="font-medium">Updated:</span> {formatDate(ticket.updated_at)}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <div className="text-sm bg-gray-50 p-3 rounded border whitespace-pre-wrap">
              {ticket.description || 'No description available'}
            </div>
          </div>

          {ticket.acceptance_criteria && (
            <div>
              <h3 className="font-medium mb-2">Acceptance Criteria</h3>
              <div className="text-sm bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                {ticket.acceptance_criteria}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StoryDetail;
