import React, { useState } from 'react';
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse, ProjectContextData } from '@/types/jira';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Code, TestTube, Loader2, CheckSquare, FileDown, Send, FileCode, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ContentDisplay from './ContentDisplay';
import ExportToGSuite from './ExportToGSuite';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface StoryGenerateContentProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
  onGenerate: (request: JiraGenerationRequest) => Promise<JiraGenerationResponse | void>;
  onPushToJira: (ticketId: string, content: string) => Promise<boolean>;
  generatedContent: JiraGenerationResponse | null;
  isGenerating: boolean;
}

type ContentType = 'lld' | 'code' | 'tests' | 'testcases';

const StoryGenerateContent: React.FC<StoryGenerateContentProps> = ({
  ticket,
  projectContext,
  selectedDocuments,
  projectContextData,
  onGenerate,
  onPushToJira,
  generatedContent,
  isGenerating
}) => {
  const [activeTab, setActiveTab] = useState<ContentType>('lld');
  const [isPushingToJira, setIsPushingToJira] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const { toast } = useToast();
  
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  const handleGenerate = async (type: ContentType) => {
    try {
      const request: JiraGenerationRequest = {
        type,
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
      };
      
      await onGenerate(request);
      setActiveTab(type);
      
      toast({
        title: "Content Generated",
        description: `${type.toUpperCase()} content has been generated successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || `Failed to generate ${type.toUpperCase()} content.`,
        variant: "destructive",
      });
    }
  };
  
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    try {
      const lldRequest: JiraGenerationRequest = {
        type: 'lld',
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
      };
      await onGenerate(lldRequest);
      
      const codeRequest: JiraGenerationRequest = {
        type: 'code',
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
      };
      await onGenerate(codeRequest);
      
      const testsRequest: JiraGenerationRequest = {
        type: 'tests',
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
      };
      await onGenerate(testsRequest);
      
      const testCasesRequest: JiraGenerationRequest = {
        type: 'testcases',
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
      };
      await onGenerate(testCasesRequest);
      
      setActiveTab('lld');
      
      toast({
        title: "All Content Generated",
        description: "LLD, Code, Tests, and Test Cases content has been generated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to generate all content.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };
  
  const handlePushToJira = async () => {
    const contentType = activeTab;
    const content = getContentByType(activeTab);
    
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
      const success = await onPushToJira(ticket.id, content);
      
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
    } finally {
      setIsPushingToJira(false);
    }
  };
  
  const exportToPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    try {
      const content = contentRef.current;
      const canvas = await html2canvas(content);
      const imgData = canvas.toDataURL('image/png');
      
      const contentType = activeTab;
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
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerate('lld')}
          disabled={isGenerating}
          className="inline-flex items-center bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
        >
          {isGenerating && activeTab === 'lld' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2 text-blue-600" />
          )}
          Generate LLD
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerate('code')}
          disabled={isGenerating}
          className="inline-flex items-center bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
        >
          {isGenerating && activeTab === 'code' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Code className="h-4 w-4 mr-2 text-green-600" />
          )}
          Generate Code
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerate('tests')}
          disabled={isGenerating}
          className="inline-flex items-center bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
        >
          {isGenerating && activeTab === 'tests' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4 mr-2 text-purple-600" />
          )}
          Generate Tests
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerate('testcases')}
          disabled={isGenerating}
          className="inline-flex items-center bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
        >
          {isGenerating && activeTab === 'testcases' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileCode className="h-4 w-4 mr-2 text-orange-600" />
          )}
          Generate Test Cases
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={handleGenerateAll}
          disabled={isGeneratingAll || isGenerating}
          className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700"
        >
          {isGeneratingAll ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckSquare className="h-4 w-4 mr-2" />
          )}
          Generate All
        </Button>
      </div>
      
      {generatedContent && (
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)}>
            <div className="flex justify-between items-center border-b px-4 py-2">
              <TabsList>
                <TabsTrigger value="lld" disabled={!getContentByType('lld')}>
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  LLD
                </TabsTrigger>
                <TabsTrigger value="code" disabled={!getContentByType('code')}>
                  <Code className="h-4 w-4 mr-2 text-green-600" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="tests" disabled={!getContentByType('tests')}>
                  <TestTube className="h-4 w-4 mr-2 text-purple-600" />
                  Tests
                </TabsTrigger>
                <TabsTrigger value="testcases" disabled={!getContentByType('testcases')}>
                  <FileCode className="h-4 w-4 mr-2 text-orange-600" />
                  Test Cases
                </TabsTrigger>
              </TabsList>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Export PDF
                </Button>
                
                <ExportToGSuite
                  storyId={ticket.id}
                  storyKey={ticket.key}
                  content={getContentByType(activeTab)}
                  contentType={activeTab}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePushToJira}
                  disabled={isPushingToJira || !getContentByType(activeTab)}
                >
                  {isPushingToJira ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Push to Jira
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={true}
                >
                  <Github className="h-4 w-4 mr-2" />
                  Bitbucket
                </Button>
              </div>
            </div>
            
            <div className="p-4" ref={contentRef}>
              <TabsContent value="lld" className="mt-0">
                <ContentDisplay content={getContentByType('lld')} contentType="lld" />
              </TabsContent>
              <TabsContent value="code" className="mt-0">
                <ContentDisplay content={getContentByType('code')} contentType="code" />
              </TabsContent>
              <TabsContent value="tests" className="mt-0">
                <ContentDisplay content={getContentByType('tests')} contentType="tests" />
              </TabsContent>
              <TabsContent value="testcases" className="mt-0">
                <ContentDisplay content={getContentByType('testcases')} contentType="testcases" />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default StoryGenerateContent;
