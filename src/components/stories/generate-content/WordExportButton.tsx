
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { JiraTicket } from '@/types/jira';
import { ContentType } from '../ContentDisplay';

interface WordExportButtonProps {
  content: string;
  contentType: ContentType;
  ticket: JiraTicket;
  className?: string;
  disabled?: boolean;
}

// This component is completely disabled to prevent errors
const WordExportButton: React.FC<WordExportButtonProps> = ({
  className = '',
}) => {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Feature Temporarily Disabled",
      description: "Word export has been temporarily disabled. Please use PDF export instead.",
      variant: "default",
    });
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={true}
      className={className}
    >
      <FileText className="h-4 w-4 mr-1" />
      Word (Disabled)
    </Button>
  );
};

export default WordExportButton;
