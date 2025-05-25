
import React, { useState } from 'react';
import { JiraTicket } from '@/types/jira';
import { ContentType } from '../ContentDisplay';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

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
    <Button 
      variant="outline" 
      size="sm" 
      disabled={true}
      title="Export functionality is temporarily disabled"
    >
      <FileDown className="h-4 w-4 mr-1" />
      Export (Disabled)
    </Button>
  );
};

export default ContentExportButton;
