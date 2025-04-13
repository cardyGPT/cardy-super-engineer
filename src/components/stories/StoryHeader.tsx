
import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JiraTicket } from '@/types/jira';

interface StoryHeaderProps {
  ticket: JiraTicket;
  isLldGenerated?: boolean;
  isCodeGenerated?: boolean;
  isTestsGenerated?: boolean;
  onOpenInJira: () => void;
}

const StoryHeader: React.FC<StoryHeaderProps> = ({
  ticket,
  isLldGenerated = false,
  isCodeGenerated = false,
  isTestsGenerated = false,
  onOpenInJira
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start gap-4">
        <h2 className="text-xl font-bold">{ticket.key}: {ticket.summary}</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onOpenInJira}
          className="flex-shrink-0"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View in Jira
        </Button>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {ticket.issuetype && (
          <Badge variant={
            ticket.issuetype.name === 'Bug' ? 'destructive' :
            ticket.issuetype.name === 'Story' ? 'default' :
            'secondary'
          }>
            {ticket.issuetype.name}
          </Badge>
        )}
        
        <Badge variant="outline">{ticket.status || 'Status Unknown'}</Badge>
        
        {isLldGenerated && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>LLD</span>
          </Badge>
        )}
        
        {isCodeGenerated && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Code</span>
          </Badge>
        )}
        
        {isTestsGenerated && (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Tests</span>
          </Badge>
        )}
      </div>
    </div>
  );
};

export default StoryHeader;
