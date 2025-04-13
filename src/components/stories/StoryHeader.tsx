
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { JiraTicket } from "@/types/jira";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface StoryHeaderProps {
  ticket: JiraTicket;
  isLldGenerated?: boolean;
  isCodeGenerated?: boolean;
  isTestsGenerated?: boolean;
  onOpenInJira?: () => void;
}

const StoryHeader: React.FC<StoryHeaderProps> = ({
  ticket,
  isLldGenerated = false,
  isCodeGenerated = false,
  isTestsGenerated = false,
  onOpenInJira
}) => {
  const getStatusColor = () => {
    const status = ticket.status?.toLowerCase() || '';
    if (status.includes('done') || status.includes('completed') || status.includes('closed')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
    } else if (status.includes('progress') || status.includes('review') || status.includes('testing')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
    } else if (status.includes('blocked') || status.includes('impediment')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityColor = () => {
    const priority = ticket.priority?.toLowerCase() || '';
    if (priority.includes('highest') || priority.includes('critical')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
    } else if (priority.includes('high')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400';
    } else if (priority.includes('medium') || priority.includes('normal')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
    } else if (priority.includes('low')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">
            {ticket.key}
          </h2>
          {ticket.issuetype?.name && (
            <Badge variant="outline" className="capitalize">
              {ticket.issuetype.name}
            </Badge>
          )}
          {ticket.isLoadingAdditionalInfo ? (
            <Skeleton className="h-5 w-24" />
          ) : ticket.sprintInfo ? (
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400">
              {ticket.sprintInfo.name}
            </Badge>
          ) : null}
          {ticket.epicInfo && !ticket.isLoadingAdditionalInfo && (
            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400">
              Epic: {ticket.epicInfo.name || ticket.epicInfo.key}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex flex-wrap gap-1">
            {isLldGenerated && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                LLD
              </Badge>
            )}
            {isCodeGenerated && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Code
              </Badge>
            )}
            {isTestsGenerated && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Tests
              </Badge>
            )}
          </div>
          {onOpenInJira && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onOpenInJira}>
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">View in Jira</span>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2">
                <p className="text-sm">View in Jira</p>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </div>
      
      <h3 className="text-lg font-medium">{ticket.summary}</h3>
      
      <div className="flex flex-wrap gap-2 pt-1">
        {ticket.status && (
          <Badge variant="outline" className={`capitalize ${getStatusColor()}`}>
            {ticket.status}
          </Badge>
        )}
        {ticket.priority && (
          <Badge variant="outline" className={`capitalize ${getPriorityColor()}`}>
            {ticket.priority} Priority
          </Badge>
        )}
        {ticket.story_points && (
          <Badge variant="outline">
            {ticket.story_points} Points
          </Badge>
        )}
        {ticket.assignee && (
          <Badge variant="outline">
            Assigned: {ticket.assignee}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default StoryHeader;
