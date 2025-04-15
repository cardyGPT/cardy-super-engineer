
import React, { useState, useRef } from 'react';
import { JiraTicket } from '@/types/jira';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import ContentDisplay, { ContentType } from './ContentDisplay';
import LoadingContent from './LoadingContent';
import { FileDown, Send, Github, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExportToGSuite from './ExportToGSuite';
import { Button } from "@/components/ui/button";
import { getContentByType } from './generate-content/utils';
import ContentTabs from './generate-content/ContentTabs';

interface StoryTabContentProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  onGenerate: () => Promise<void>;
  onPushToJira: (content: string) => Promise<boolean>;
}

const StoryTabContent: React.FC<StoryTabContentProps> = ({
  ticket,
  projectContext,
  selectedDocuments,
  onGenerate,
  onPushToJira
}) => {
  const [activeContent, setActiveContent] = useState<ContentType>('lld');
  const [isPushingToJira, setIsPushingToJira] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { generatedContent, contentLoading } = useStories();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const exportToPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    try {
      const content = contentRef.current;
      const canvas = await html2canvas(content);
      const imgData = canvas.toDataURL('image/png');
      
      const contentType = activeContent;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${ticket.key}_${contentType}.pdf`);
      
      toast({
        title: "PDF Exported",
        description: `${contentType.toUpperCase()} content has been exported as PDF.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to export content as PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handlePushToJira = async () => {
    const content = getContentByType(generatedContent, activeContent);
    
    if (!content) {
      toast({
        title: "Error",
        description: "No content to push to Jira.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPushingToJira(true);
    try {
      const success = await onPushToJira(content);
      
      if (success) {
        toast({
          title: "Content Pushed",
          description: `${activeContent.toUpperCase()} content has been pushed to Jira ticket ${ticket.key}.`,
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
    } finally {
      setIsPushingToJira(false);
    }
  };
  
  if (contentLoading) {
    return (
      <LoadingContent 
        message="Generating content, please wait..."
        isLoading={true}
      />
    );
  }
  
  const hasContent = Boolean(
    getContentByType(generatedContent, 'lld') || 
    getContentByType(generatedContent, 'code') || 
    getContentByType(generatedContent, 'tests') ||
    getContentByType(generatedContent, 'testcases')
  );
  
  if (!hasContent) {
    return (
      <LoadingContent
        message="No content generated yet"
        isInfo={true}
        additionalMessage="Select one of the generation options from the sidebar to create content for this ticket"
      />
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={activeContent} onValueChange={(value) => setActiveContent(value as ContentType)} className="w-full">
          <ContentTabs
            activeTab={activeContent}
            onChange={(value) => setActiveContent(value)}
            hasLldContent={!!getContentByType(generatedContent, 'lld')}
            hasCodeContent={!!getContentByType(generatedContent, 'code')}
            hasTestsContent={!!getContentByType(generatedContent, 'tests')}
            hasTestCasesContent={!!getContentByType(generatedContent, 'testcases')}
          />
        </Tabs>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={isExporting || !getContentByType(generatedContent, activeContent)}
            className="h-9"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-1" />
            )}
            PDF
          </Button>
          
          <ExportToGSuite
            storyId={ticket.id}
            storyKey={ticket.key}
            content={getContentByType(generatedContent, activeContent)}
            contentType={activeContent}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handlePushToJira}
            disabled={isPushingToJira || !getContentByType(generatedContent, activeContent)}
            className="h-9"
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
            disabled={true}
            className="h-9"
          >
            <Github className="h-4 w-4 mr-1" />
            Bitbucket
          </Button>
        </div>
      </div>
      
      <Card className="border rounded-md overflow-hidden shadow-sm">
        <CardContent className="p-6" ref={contentRef}>
          <ContentDisplay 
            content={getContentByType(generatedContent, activeContent)} 
            contentType={activeContent} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryTabContent;
