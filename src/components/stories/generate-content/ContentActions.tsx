
import React from 'react';
import { ContentType } from '../ContentDisplay';
import { Button } from "@/components/ui/button";
import { Loader2, FileDown, Send, Github, Save } from "lucide-react";
import ExportToGSuite from '../ExportToGSuite';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContentActionsProps {
  activeTab: ContentType;
  content: string;
  isExporting: boolean;
  isSaving: boolean;
  isPushingToJira: boolean;
  onExportPDF: () => void;
  onSaveToDatabase: () => void;
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
  onExportPDF,
  onSaveToDatabase,
  onPushToJira,
  storyId,
  storyKey
}) => {
  return (
    <TooltipProvider>
      <div className="flex space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onSaveToDatabase}
              disabled={isSaving || !content}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save to Database</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onExportPDF}
              disabled={isExporting || !content}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export PDF</p>
          </TooltipContent>
        </Tooltip>
        
        <ExportToGSuite
          storyId={storyId}
          storyKey={storyKey}
          content={content}
          contentType={activeTab}
          iconOnly={true}
        />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onPushToJira}
              disabled={isPushingToJira || !content}
            >
              {isPushingToJira ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Push to Jira</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={true}
            >
              <Github className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Push to Bitbucket (Coming Soon)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ContentActions;
