
import React, { useState } from 'react';
import { JiraTicket } from '@/types/jira';
import { ContentType } from '../ContentDisplay';
import WordExportButton from './WordExportButton';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ContentExportButtonProps {
  content: string;
  contentType: ContentType;
  ticket: JiraTicket;
  disabled?: boolean;
}

const ContentExportButton: React.FC<ContentExportButtonProps> = ({
  content,
  contentType,
  ticket,
  disabled = false
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  if (!content) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={true}
      >
        <FileDown className="h-4 w-4 mr-1" />
        Export
      </Button>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <FileDown className="h-4 w-4 mr-1" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Export options:</h4>
          
          <div className="flex flex-col gap-2">
            {/* We've left the button but it's completely disabled */}
            <WordExportButton
              content={content}
              contentType={contentType}
              ticket={ticket}
              className="w-full justify-start"
              disabled={true}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ContentExportButton;
