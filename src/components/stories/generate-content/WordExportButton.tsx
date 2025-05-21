
import React, { useState } from 'react';
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
      console.log('Word export functionality temporarily disabled due to issues');
      
      // Notify the user that the export functionality is temporarily disabled
      toast({
        title: "Export Notice",
        description: "Word export is temporarily disabled. Feature will be available soon.",
      });
      
      /* Original export code commented out due to issues
      console.log('Starting Word export for', contentType);
      
      // Format filename properly
      const formattedDate = new Date().toISOString().split('T')[0];
      const fileName = `${ticket.key}_${contentType}_${formattedDate}`;
      
      // Get the company logo URL
      const logoUrl = '/cardinality-logo.png';
      
      console.log('Exporting to Word with fileName:', fileName);
      
      // Call the exportToWord utility function
      await exportToWord(content, fileName, logoUrl);
      
      console.log('Word export completed successfully');
      */
      
    } catch (error) {
      console.error('Error with export functionality:', error);
      toast({
        title: "Export Feature Notice",
        description: "Export functionality is currently being revised.",
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
      <FileText className="h-4 w-4 mr-1" />
      Word
    </Button>
  );
};

export default WordExportButton;
