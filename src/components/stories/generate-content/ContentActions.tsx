
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Save, Send, Github, Loader2 } from "lucide-react";
import { ContentType } from '../ContentDisplay';
import ExportToGSuite from '../ExportToGSuite';

interface ContentActionsProps {
  activeTab: ContentType;
  content: string;
  isExporting: boolean;
  isSaving: boolean;
  isPushingToJira: boolean;
  isAllSaving?: boolean;
  onExportPDF: () => void;
  onSaveToDatabase: () => void;
  onSaveAllToDatabase?: () => void;
  onPushToJira: () => void;
  storyId: string;
  storyKey: string;
}

const ContentActions: React.FC<ContentActionsProps> = ({
  activeTab,
  content,
  isExporting,
  isSaving,
  isPushingToJira,
  isAllSaving,
  onExportPDF,
  onSaveToDatabase,
  onSaveAllToDatabase,
  onPushToJira,
  storyId,
  storyKey
}) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExportPDF}
        disabled={isExporting || !content}
        className="h-9"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4 mr-1" />
        )}
        PDF
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
        onClick={onSaveToDatabase}
        disabled={isSaving || !content}
        className="h-9"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-1" />
        )}
        Save
      </Button>

      {onSaveAllToDatabase && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveAllToDatabase}
          disabled={isAllSaving || !content}
          className="h-9"
        >
          {isAllSaving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save All
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={onPushToJira}
        disabled={isPushingToJira || !content}
        className="h-9"
      >
        {isPushingToJira ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-1" />
        )}
        Jira
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        disabled={true}
        className="h-9"
      >
        <Github className="h-4 w-4 mr-1" />
        Bitbucket
      </Button>
    </div>
  );
};

export default ContentActions;
