
import React from 'react';
import ContentExportManager from './ContentExportManager';
import { ContentType } from '../ContentDisplay';
import { useStories } from '@/contexts/StoriesContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, RefreshCw, Save, FileDown, Send } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ContentActionsProps {
  activeTab: ContentType;
  content: string;
  isExporting: boolean;
  isSaving: boolean;
  isPushingToJira: boolean;
  isRegenerating?: boolean;
  onExportPDF: () => Promise<void>;
  onSaveToDatabase: () => Promise<void>;
  onPushToJira: () => Promise<void>;
  onRegenerateContent?: () => Promise<void>;
  onShowPromptInput?: () => void;
  storyId: string;
  storyKey: string;
}

const ContentActions: React.FC<ContentActionsProps> = ({
  activeTab,
  content,
  isExporting,
  isSaving,
  isPushingToJira,
  isRegenerating = false,
  onExportPDF,
  onSaveToDatabase,
  onPushToJira,
  onRegenerateContent,
  onShowPromptInput,
  storyId,
  storyKey
}) => {
  const { selectedTicket } = useStories();
  
  if (!selectedTicket) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex gap-2">
        <TooltipProvider>
          {onRegenerateContent && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRegenerateContent}
                  disabled={isRegenerating}
                  className="flex items-center gap-1"
                >
                  {isRegenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Regenerate</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate this content</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSaveToDatabase}
                disabled={isSaving || !content}
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save content to database</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {onShowPromptInput && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onShowPromptInput}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Custom Prompt</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Customize with a prompt</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <ContentExportManager 
          content={content}
          contentType={activeTab}
          ticket={selectedTicket}
          onPushToJira={(content) => {
            onPushToJira();
            return Promise.resolve(true);
          }}
          onSaveContent={(content) => {
            onSaveToDatabase();
            return Promise.resolve(true);
          }}
          onRegenerateContent={() => {
            if (onRegenerateContent) {
              onRegenerateContent();
            }
            return Promise.resolve();
          }}
          isExporting={isExporting}
          isSaving={isSaving}
          isPushingToJira={isPushingToJira}
          isRegenerating={isRegenerating}
        />
      </div>
      
      {/* Mobile dropdown menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onRegenerateContent && (
              <DropdownMenuItem onClick={() => onRegenerateContent()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onSaveToDatabase}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </DropdownMenuItem>
            {onShowPromptInput && (
              <DropdownMenuItem onClick={onShowPromptInput}>
                Custom Prompt
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPushToJira}>
              <Send className="h-4 w-4 mr-2" />
              Push to Jira
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ContentActions;
