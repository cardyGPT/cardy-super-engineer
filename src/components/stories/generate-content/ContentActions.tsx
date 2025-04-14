
import React from 'react';
import { ContentType } from '../ContentDisplay';
import { Button } from "@/components/ui/button";
import { Loader2, FileDown, Send, Github } from "lucide-react";
import ExportToGSuite from '../ExportToGSuite';

interface ContentActionsProps {
  activeTab: ContentType;
  content: string;
  isExporting: boolean;
  isPushingToJira: boolean;
  onExportPDF: () => void;
  onPushToJira: () => void;
  storyId: string;
  storyKey: string;
}

const ContentActions: React.FC<ContentActionsProps> = ({
  activeTab,
  content,
  isExporting,
  isPushingToJira,
  onExportPDF,
  onPushToJira,
  storyId,
  storyKey
}) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExportPDF}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4 mr-2" />
        )}
        Export PDF
      </Button>
      
      <ExportToGSuite
        storyId={storyId}
        storyKey={storyKey}
        content={content}
        contentType={activeTab}
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={onPushToJira}
        disabled={isPushingToJira || !content}
      >
        {isPushingToJira ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Push to Jira
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        disabled={true}
      >
        <Github className="h-4 w-4 mr-2" />
        Bitbucket
      </Button>
    </div>
  );
};

export default ContentActions;
