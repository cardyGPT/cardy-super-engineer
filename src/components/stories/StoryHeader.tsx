
import React from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";
import { JiraTicket } from "@/types/jira";

interface StoryHeaderProps {
  ticket: JiraTicket;
  isLldGenerated: boolean;
  isCodeGenerated: boolean;
  isTestsGenerated: boolean;
  onOpenInJira: () => void;
}

const StoryHeader: React.FC<StoryHeaderProps> = ({
  ticket,
  isLldGenerated,
  isCodeGenerated,
  isTestsGenerated,
  onOpenInJira,
}) => {
  return (
    <div className="pb-2">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>{ticket.key}: {ticket.summary}</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={onOpenInJira}
              title="Open in Jira"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="mt-1 flex flex-wrap gap-1">
            <Badge variant="outline">{ticket.issuetype?.name || 'Unknown Type'}</Badge>
            {ticket.priority && <Badge variant="outline">{ticket.priority}</Badge>}
            {ticket.status && <Badge variant="outline">{ticket.status}</Badge>}
            {ticket.story_points && <Badge variant="outline">{ticket.story_points} points</Badge>}
          </CardDescription>
        </div>
        <div className="flex gap-1">
          {isLldGenerated && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">LLD</Badge>}
          {isCodeGenerated && <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Code</Badge>}
          {isTestsGenerated && <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Tests</Badge>}
        </div>
      </div>
    </div>
  );
};

export default StoryHeader;
