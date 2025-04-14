
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileShare, Loader2 } from "lucide-react";
import { exportToGoogleDocs } from '@/contexts/stories/api/gsuite';
import { useToast } from "@/hooks/use-toast";
import { ContentType } from './ContentDisplay';

interface ExportToGSuiteProps {
  storyId: string;
  storyKey: string;
  content: string;
  contentType: ContentType;
}

const ExportToGSuite: React.FC<ExportToGSuiteProps> = ({
  storyId,
  storyKey,
  content,
  contentType
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
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
      await exportToGoogleDocs(storyId, storyKey, content, contentType);
      
      toast({
        title: "Content Exported",
        description: `${contentType.toUpperCase()} content has been exported to Google Docs`,
      });
    } catch (err: any) {
      console.error('Error exporting to GSuite:', err);
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export content to Google Docs",
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
      disabled={isExporting || !content}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileShare className="h-4 w-4 mr-2" />
      )}
      Google Docs
    </Button>
  );
};

export default ExportToGSuite;
