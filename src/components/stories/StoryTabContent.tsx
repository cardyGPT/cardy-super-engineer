import React, { useState } from 'react';
import { JiraTicket } from '@/types/jira';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentDisplay, { ContentType } from './ContentDisplay';
import LoadingContent from './LoadingContent';
import { FileDown, Send, Github, FileText, Code, TestTube, Loader2, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExportToGSuite from './ExportToGSuite';

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
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  const getContentByType = (type: ContentType) => {
    if (!generatedContent) return '';
    
    switch (type) {
      case 'lld':
        return generatedContent.lldContent || generatedContent.lld || '';
      case 'code':
        return generatedContent.codeContent || generatedContent.code || '';
      case 'tests':
        return generatedContent.testContent || generatedContent.tests || '';
      case 'testcases':
        return generatedContent.testCasesContent || '';
      default:
        return '';
    }
  };
  
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
    const content = getContentByType(activeContent);
    
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
    getContentByType('lld') || 
    getContentByType('code') || 
    getContentByType('tests') ||
    getContentByType('testcases')
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
          <TabsList className="inline-flex space-x-1 rounded-lg bg-muted p-1">
            <TabsTrigger
              value="lld"
              className={`inline-flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm ${!getContentByType('lld') ? 'opacity-50' : ''}`}
              disabled={!getContentByType('lld')}
            >
              <FileText className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
              LLD
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className={`inline-flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm ${!getContentByType('code') ? 'opacity-50' : ''}`}
              disabled={!getContentByType('code')}
            >
              <Code className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
              Code
            </TabsTrigger>
            <TabsTrigger
              value="tests"
              className={`inline-flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm ${!getContentByType('tests') ? 'opacity-50' : ''}`}
              disabled={!getContentByType('tests')}
            >
              <TestTube className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
              Tests
            </TabsTrigger>
            <TabsTrigger
              value="testcases"
              className={`inline-flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm ${!getContentByType('testcases') ? 'opacity-50' : ''}`}
              disabled={!getContentByType('testcases')}
            >
              <FileCode className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
              Test Cases
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={isExporting || !getContentByType(activeContent)}
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
            content={getContentByType(activeContent)}
            contentType={activeContent}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handlePushToJira}
            disabled={isPushingToJira || !getContentByType(activeContent)}
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
            content={getContentByType(activeContent)} 
            contentType={activeContent} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryTabContent;
