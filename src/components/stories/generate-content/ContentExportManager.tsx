import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  FileDown, 
  Send, 
  Github, 
  Loader2, 
  Save,
  FileEdit,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ContentType } from '@/types/jira';
import { JiraTicket } from '@/types/jira';
import { formatTimestampForFilename } from '@/utils/exportUtils';
import DocumentExportFormatter from './DocumentExportFormatter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ContentExportManagerProps {
  content: string | null;
  contentType: ContentType;
  ticket: JiraTicket;
  onPushToJira: (content: string) => Promise<boolean>;
  onSaveContent: (content: string) => Promise<boolean>;
  onRegenerateContent: () => Promise<void>;
  isExporting?: boolean;
  isSaving?: boolean;
  isPushingToJira?: boolean;
  isRegenerating?: boolean;
  onExportComplete?: () => void;
}

const ContentExportManager: React.FC<ContentExportManagerProps> = ({
  content,
  contentType,
  ticket,
  onPushToJira,
  onSaveContent,
  onRegenerateContent,
  isExporting = false,
  isSaving = false,
  isPushingToJira = false,
  isRegenerating = false,
  onExportComplete
}) => {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [previewDocumentOpen, setPreviewDocumentOpen] = useState(false);
  const [userName, setUserName] = useState<string>('AI Assistant');
  
  const exportToPDF = async () => {
    if (!content || !contentRef.current) {
      toast({
        title: "Error",
        description: "No content to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create formatted document
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Create filename with timestamp
      const timestamp = formatTimestampForFilename();
      const filename = `${ticket.key}_${contentType}_${timestamp}.pdf`;
      
      pdf.save(filename);
      
      if (onExportComplete) {
        onExportComplete();
      }
      
      toast({
        title: "PDF Exported",
        description: `${contentType.toUpperCase()} content has been exported as PDF.`,
      });
    } catch (err: any) {
      console.error('Error exporting to PDF:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to export content as PDF.",
        variant: "destructive",
      });
    }
  };
  
  const handlePushToJira = async () => {
    if (!content) {
      toast({
        title: "Error",
        description: "No content to push to Jira.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const success = await onPushToJira(content);
      
      if (success) {
        toast({
          title: "Content Pushed",
          description: `${contentType.toUpperCase()} content has been pushed to Jira ticket ${ticket.key}.`,
        });
      } else {
        throw new Error("Failed to push content to Jira.");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to push content to Jira.",
        variant: "destructive",
      });
    }
  };
  
  const handleSaveContent = async () => {
    if (!content) {
      toast({
        title: "Error",
        description: "No content to save.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const success = await onSaveContent(content);
      
      if (success) {
        toast({
          title: "Content Saved",
          description: `${contentType.toUpperCase()} content has been saved.`,
        });
      } else {
        throw new Error("Failed to save content.");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save content.",
        variant: "destructive",
      });
    }
  };
  
  const handlePreviewDocument = () => {
    if (!content) {
      toast({
        title: "Error",
        description: "No content to preview.",
        variant: "destructive",
      });
      return;
    }
    
    setPreviewDocumentOpen(true);
  };

  const handleRegenerateContent = async () => {
    try {
      await onRegenerateContent();
      toast({
        title: "Content Regenerated",
        description: `${contentType.toUpperCase()} content has been regenerated.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to regenerate content.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviewDocument}
          disabled={!content}
          className="h-8"
        >
          <FileEdit className="h-4 w-4 mr-1" />
          Preview
        </Button>
      
        <Button
          variant="outline"
          size="sm"
          onClick={exportToPDF}
          disabled={isExporting || !content}
          className="h-8"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-1" />
          )}
          Export
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveContent}
          disabled={isSaving || !content}
          className="h-8"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handlePushToJira}
          disabled={isPushingToJira || !content}
          className="h-8"
        >
          {isPushingToJira ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-1" />
          )}
          Jira
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerateContent}
          disabled={isRegenerating || !content}
          className="h-8"
        >
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Regenerate
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          disabled={true}
          className="h-8"
        >
          <Github className="h-4 w-4 mr-1" />
          Bitbucket
        </Button>
      </div>
      
      {/* Hidden div for PDF export */}
      <div className="hidden">
        <div ref={contentRef}>
          <DocumentExportFormatter
            content={content || ''}
            contentType={contentType}
            ticket={ticket}
            userName={userName}
          />
        </div>
      </div>
      
      {/* Document Preview Dialog */}
      <Dialog open={previewDocumentOpen} onOpenChange={setPreviewDocumentOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <DocumentExportFormatter
            content={content || ''}
            contentType={contentType}
            ticket={ticket}
            userName={userName}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContentExportManager;
