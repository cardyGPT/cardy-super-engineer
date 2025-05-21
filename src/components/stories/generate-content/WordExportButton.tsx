
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToWord } from '@/utils/wordExportUtils';
import { JiraTicket } from '@/types/jira';
import { ContentType } from '../ContentDisplay';

interface WordExportButtonProps {
  content: string;
  contentType: ContentType;
  ticket: JiraTicket;
  className?: string;
  disabled?: boolean;
}

const WordExportButton: React.FC<WordExportButtonProps> = ({
  content,
  contentType,
  ticket,
  className = '',
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const getContentTypeLabel = (type: ContentType): string => {
    switch(type) {
      case 'lld': return 'Low-Level Design';
      case 'code': return 'Implementation Code';
      case 'tests': return 'Unit Tests';
      case 'testcases': return 'Test Cases';
      case 'testScripts': return 'Test Scripts';
      default: return type;
    }
  };

  const handleExport = async () => {
    if (!content) {
      toast({
        title: "No Content",
        description: "There is no content to export",
        variant: "destructive",
      });
      return;
    }
    
    setIsExporting(true);
    try {
      // Format filename properly
      const formattedDate = new Date().toISOString().split('T')[0];
      const fileName = `${ticket.key}_${contentType}_${formattedDate}`;
      
      // Get the company logo URL
      const logoUrl = '/cardinality-logo.png';
      
      // Call the exportToWord utility function
      await exportToWord(content, fileName, logoUrl);
      
      toast({
        title: "Export Successful",
        description: `${getContentTypeLabel(contentType)} exported as Word document.`,
        variant: "success",
      });
    } catch (error) {
      console.error('Error exporting to Word:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export content as Word document.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || disabled || !content}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-1" />
      )}
      Word
    </Button>
  );
};

export default WordExportButton;
