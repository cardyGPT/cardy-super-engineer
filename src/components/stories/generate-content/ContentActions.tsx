
import React from 'react';
import ContentExportManager from './ContentExportManager';
import { ContentType } from '../ContentDisplay';
import { useStories } from '@/contexts/StoriesContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface ContentActionsProps {
  activeTab: ContentType;
  content: string;
  isExporting: boolean;
  isSaving: boolean;
  isPushingToJira: boolean;
  onExportPDF: () => Promise<void>;
  onSaveToDatabase: () => Promise<void>;
  onPushToJira: () => Promise<void>;
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
  const { selectedTicket } = useStories();
  
  if (!selectedTicket) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex">
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
            return Promise.resolve();
          }}
          isExporting={isExporting}
          isSaving={isSaving}
          isPushingToJira={isPushingToJira}
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
            <DropdownMenuItem onClick={onExportPDF}>
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSaveToDatabase}>
              Save
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPushToJira}>
              Push to Jira
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ContentActions;
