
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Copy, MessageSquare, Cloud, GitBranch, FileOutput
} from "lucide-react";

interface ContentActionsProps {
  content: string;
  contentType: string;
  isCopied: Record<string, boolean>;
  isPushing: Record<string, boolean>;
  onCopy: (content: string, type: string) => void;
  onPushToJira: (content: string, type: string) => void;
  onPushToGDrive: (content: string, type: string) => void;
  onPushToBitbucket: (content: string, type: string) => void;
  onDownloadPDF: (content: string, type: string) => void;
}

const ContentActions: React.FC<ContentActionsProps> = ({
  content,
  contentType,
  isCopied,
  isPushing,
  onCopy,
  onPushToJira,
  onPushToGDrive,
  onPushToBitbucket,
  onDownloadPDF
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onCopy(content, contentType)}
      >
        <Copy className="mr-2 h-4 w-4" />
        {isCopied[contentType] ? 'Copied!' : 'Copy'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPushToJira(content, contentType)}
        disabled={isPushing[`jira-${contentType}`]}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        {isPushing[`jira-${contentType}`] ? 'Pushing...' : 'Push to Jira'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPushToGDrive(content, contentType)}
        disabled={isPushing[`gdrive-${contentType}`]}
      >
        <Cloud className="mr-2 h-4 w-4" />
        {isPushing[`gdrive-${contentType}`] ? 'Pushing...' : 'Push to Drive'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPushToBitbucket(content, contentType)}
        disabled={isPushing[`bitbucket-${contentType}`]}
      >
        <GitBranch className="mr-2 h-4 w-4" />
        {isPushing[`bitbucket-${contentType}`] ? 'Pushing...' : 'Push to Bitbucket'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDownloadPDF(content, contentType)}
        disabled={isPushing[`pdf-${contentType}`]}
      >
        <FileOutput className="mr-2 h-4 w-4" />
        {isPushing[`pdf-${contentType}`] ? 'Generating...' : 'Download as PDF'}
      </Button>
    </div>
  );
};

export default ContentActions;
