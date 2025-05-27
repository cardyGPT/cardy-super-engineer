
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContentType } from '@/types/jira';
import { exportToGoogleDocs } from '@/contexts/stories/api/gsuite';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExportToGSuiteProps {
  storyId: string;
  storyKey: string;
  content: string | null;
  contentType: ContentType;
  iconOnly?: boolean;
}

const ExportToGSuite: React.FC<ExportToGSuiteProps> = ({
  storyId,
  storyKey,
  content,
  contentType,
  iconOnly = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!content) {
      toast({
        title: "No content to export",
        description: "Please generate content first.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportToGoogleDocs(storyId, storyKey, content, contentType);
      toast({
        title: "Exported to Google Drive",
        description: "Content has been successfully exported to Google Drive.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export content to Google Drive.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  if (iconOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExport}
              disabled={isExporting || !content}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export to Google Drive</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || !content}
      className="h-9"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-1" />
      )}
      Drive
    </Button>
  );
};

export default ExportToGSuite;
