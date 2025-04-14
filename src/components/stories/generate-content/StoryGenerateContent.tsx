
import React, { useState, useRef } from 'react';
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse, ProjectContextData } from '@/types/jira';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ContentDisplay, { ContentType } from '../ContentDisplay';
import { getContentByType } from './utils';
import GenerateButtons from './GenerateButtons';
import ContentTabs from './ContentTabs';
import ContentActions from './ContentActions';
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
  
  const contentRef = useRef<HTMLDivElement>(null);
  
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
      const types: ContentType[] = ['lld', 'code', 'tests', 'testcases'];
      
      for (const type of types) {
        const request: JiraGenerationRequest = {
          type,
          jiraTicket: ticket,
          projectContext: projectContext || undefined,
          selectedDocuments: selectedDocuments || [],
        };
        await onGenerate(request);
      }
      
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
    const content = getContentByType(generatedContent, activeTab);
    
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
          description: `${activeTab.toUpperCase()} content has been pushed to Jira ticket ${ticket.key}.`,
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
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${ticket.key}_${activeTab}.pdf`);
      
      toast({
        title: "PDF Exported",
        description: `${activeTab.toUpperCase()} content has been exported as PDF.`,
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
  
  return (
    <div className="space-y-4">
      <GenerateButtons 
        onGenerate={handleGenerate}
        onGenerateAll={handleGenerateAll}
        isGenerating={isGenerating}
        isGeneratingAll={isGeneratingAll}
        activeTab={activeTab}
      />
      
      {generatedContent && (
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)}>
            <div className="flex justify-between items-center border-b px-4 py-2">
              <ContentTabs 
                activeTab={activeTab}
                onChange={(value) => setActiveTab(value)}
                hasLldContent={!!getContentByType(generatedContent, 'lld')}
                hasCodeContent={!!getContentByType(generatedContent, 'code')}
                hasTestsContent={!!getContentByType(generatedContent, 'tests')}
                hasTestCasesContent={!!getContentByType(generatedContent, 'testcases')}
              />
              
              <ContentActions 
                activeTab={activeTab}
                content={getContentByType(generatedContent, activeTab)}
                isExporting={isExporting}
                isPushingToJira={isPushingToJira}
                onExportPDF={exportToPDF}
                onPushToJira={handlePushToJira}
                storyId={ticket.id}
                storyKey={ticket.key}
              />
            </div>
            
            <div className="p-4" ref={contentRef}>
              <TabsContent value="lld" className="mt-0">
                <ContentDisplay content={getContentByType(generatedContent, 'lld')} contentType="lld" />
              </TabsContent>
              <TabsContent value="code" className="mt-0">
                <ContentDisplay content={getContentByType(generatedContent, 'code')} contentType="code" />
              </TabsContent>
              <TabsContent value="tests" className="mt-0">
                <ContentDisplay content={getContentByType(generatedContent, 'tests')} contentType="tests" />
              </TabsContent>
              <TabsContent value="testcases" className="mt-0">
                <ContentDisplay content={getContentByType(generatedContent, 'testcases')} contentType="testcases" />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default StoryGenerateContent;
