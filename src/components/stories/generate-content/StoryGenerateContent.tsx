
import React, { useState, useRef, useEffect } from 'react';
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse, ProjectContextData } from '@/types/jira';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { useToast } from "@/hooks/use-toast";
import ContentDisplay, { ContentType } from '../ContentDisplay';
import { getContentByType } from './utils';
import GenerateButtons from './GenerateButtons';
import ContentTabs from './ContentTabs';
import ContentActions from './ContentActions';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface ExistingArtifacts {
  lldContent: string | null;
  codeContent: string | null;
  testContent: string | null;
  testCasesContent: string | null;
}

interface StoryGenerateContentProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
  onGenerate: (request: JiraGenerationRequest) => Promise<JiraGenerationResponse | void>;
  onPushToJira: (ticketId: string, content: string) => Promise<boolean>;
  generatedContent: JiraGenerationResponse | null;
  isGenerating: boolean;
  existingArtifacts?: ExistingArtifacts;
}

const StoryGenerateContent: React.FC<StoryGenerateContentProps> = ({
  ticket,
  projectContext,
  selectedDocuments,
  projectContextData,
  onGenerate,
  onPushToJira,
  generatedContent,
  isGenerating,
  existingArtifacts
}) => {
  const [activeTab, setActiveTab] = useState<ContentType>('lld');
  const [isPushingToJira, setIsPushingToJira] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingContentType, setGeneratingContentType] = useState<ContentType | null>(null);
  const { toast } = useToast();
  
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Effect to update the content when ticket changes or when artifacts are loaded
  useEffect(() => {
    // Reset any in-memory content when the ticket changes
    if (existingArtifacts && 
        (existingArtifacts.lldContent || 
         existingArtifacts.codeContent || 
         existingArtifacts.testContent || 
         existingArtifacts.testCasesContent)) {
      // If we have stored content, set the active tab to the first available content
      if (existingArtifacts.lldContent) {
        setActiveTab('lld');
      } else if (existingArtifacts.codeContent) {
        setActiveTab('code');
      } else if (existingArtifacts.testContent) {
        setActiveTab('tests');
      } else if (existingArtifacts.testCasesContent) {
        setActiveTab('testcases');
      }
    }
  }, [ticket.key, existingArtifacts]);

  // Combine generatedContent with existingArtifacts
  const combinedContent: JiraGenerationResponse = {
    ...(existingArtifacts || {}),
    ...(generatedContent || {})
  };
  
  // Determine if we have any existing content
  const hasAnyContent = Boolean(
    combinedContent.lldContent || 
    combinedContent.codeContent || 
    combinedContent.testContent || 
    combinedContent.testCasesContent
  );
  
  const handleGenerate = async (type: ContentType) => {
    try {
      // Check dependencies for generation process
      if (type === 'code' && !combinedContent.lldContent) {
        toast({
          title: "Missing LLD",
          description: "Please generate an LLD first before generating code.",
          variant: "destructive",
        });
        return;
      }
      
      if (type === 'tests' && !combinedContent.codeContent) {
        toast({
          title: "Missing Code",
          description: "Please generate code first before generating tests.",
          variant: "destructive",
        });
        return;
      }
      
      if (type === 'testcases' && !combinedContent.lldContent) {
        toast({
          title: "Missing LLD",
          description: "Please generate an LLD first before generating test cases.",
          variant: "destructive",
        });
        return;
      }
      
      // Set which content type is being generated
      setGeneratingContentType(type);
      
      const request: JiraGenerationRequest = {
        type,
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
        additionalContext: {}
      };
      
      // Add previous artifacts to context for subsequent generations
      if (type !== 'lld') {
        if (combinedContent.lldContent) {
          request.additionalContext = {
            ...request.additionalContext,
            lldContent: combinedContent.lldContent
          };
        }
        
        if (type === 'tests' && combinedContent.codeContent) {
          request.additionalContext = {
            ...request.additionalContext,
            codeContent: combinedContent.codeContent
          };
        }
        
        if (type === 'testcases') {
          if (combinedContent.codeContent) {
            request.additionalContext = {
              ...request.additionalContext,
              codeContent: combinedContent.codeContent
            };
          }
          if (combinedContent.testContent) {
            request.additionalContext = {
              ...request.additionalContext,
              testContent: combinedContent.testContent
            };
          }
        }
      }
      
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
    } finally {
      setGeneratingContentType(null);
    }
  };
  
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    try {
      // Generate in specific sequence: LLD -> Code -> TestCases -> Tests
      const types: ContentType[] = ['lld', 'code', 'testcases', 'tests'];
      
      for (const type of types) {
        setGeneratingContentType(type);
        const request: JiraGenerationRequest = {
          type,
          jiraTicket: ticket,
          projectContext: projectContext || undefined,
          selectedDocuments: selectedDocuments || [],
          additionalContext: {}
        };
        
        // Add previous artifacts to context for subsequent generations
        if (type !== 'lld') {
          if (combinedContent.lldContent || generatedContent?.lldContent) {
            request.additionalContext = {
              ...request.additionalContext,
              lldContent: combinedContent.lldContent || generatedContent?.lldContent
            };
          }
          
          if (type === 'tests' && (combinedContent.codeContent || generatedContent?.codeContent)) {
            request.additionalContext = {
              ...request.additionalContext,
              codeContent: combinedContent.codeContent || generatedContent?.codeContent
            };
          }
          
          if (type === 'testcases') {
            if (combinedContent.codeContent || generatedContent?.codeContent) {
              request.additionalContext = {
                ...request.additionalContext,
                codeContent: combinedContent.codeContent || generatedContent?.codeContent
              };
            }
            if (combinedContent.testContent || generatedContent?.testContent) {
              request.additionalContext = {
                ...request.additionalContext,
                testContent: combinedContent.testContent || generatedContent?.testContent
              };
            }
          }
        }
        
        await onGenerate(request);
      }
      
      setActiveTab('lld');
      
      toast({
        title: "All Content Generated",
        description: "LLD, Code, Test Cases, and Tests content has been generated successfully.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to generate all content.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAll(false);
      setGeneratingContentType(null);
    }
  };
  
  const handlePushToJira = async () => {
    const content = getContentByType(combinedContent, activeTab);
    
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

  // Determine if a specific type of content is already generated
  const hasContentType = (type: ContentType): boolean => {
    return Boolean(getContentByType(combinedContent, type));
  };
  
  // Determine which content type is next in the sequence
  const getNextContentType = (): ContentType | null => {
    if (!hasContentType('lld')) return 'lld';
    if (!hasContentType('code')) return 'code';
    if (!hasContentType('testcases')) return 'testcases';
    if (!hasContentType('tests')) return 'tests';
    return null;
  };

  // Show information about existing content and generation sequence
  const renderStatusInfo = () => {
    if (!hasAnyContent) {
      return (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Getting Started</AlertTitle>
          <AlertDescription>
            Start by generating the Low-Level Design (LLD) for this ticket. Once the LLD is created, you can proceed 
            to generate implementation code, test cases, and tests in sequence.
          </AlertDescription>
        </Alert>
      );
    }
    
    const nextType = getNextContentType();
    if (nextType) {
      const nextTypeLabel = nextType === 'lld' ? 'Low-Level Design' :
                            nextType === 'code' ? 'Implementation Code' :
                            nextType === 'testcases' ? 'Test Cases' : 'Automation Tests';
      
      return (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Next Step</AlertTitle>
          <AlertDescription>
            Your next step is to generate {nextTypeLabel}. The system will automatically use previously generated
            content to provide better context.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert className="mb-4" variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>All Content Generated</AlertTitle>
        <AlertDescription>
          You have generated all content types for this ticket. You can view, export, or push this content to Jira.
        </AlertDescription>
      </Alert>
    );
  };
  
  return (
    <div className="space-y-4">
      {renderStatusInfo()}
      
      <GenerateButtons 
        onGenerate={handleGenerate}
        onGenerateAll={handleGenerateAll}
        isGenerating={isGenerating}
        isGeneratingAll={isGeneratingAll}
        activeTab={activeTab}
        generatingContentType={generatingContentType}
        hasLldContent={hasContentType('lld')}
        hasCodeContent={hasContentType('code')}
        hasTestsContent={hasContentType('tests')}
        hasTestCasesContent={hasContentType('testcases')}
      />
      
      {hasAnyContent && (
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)}>
            <div className="flex justify-between items-center border-b px-4 py-2">
              <ContentTabs 
                activeTab={activeTab}
                onChange={(value) => setActiveTab(value)}
                hasLldContent={hasContentType('lld')}
                hasCodeContent={hasContentType('code')}
                hasTestsContent={hasContentType('tests')}
                hasTestCasesContent={hasContentType('testcases')}
              />
              
              <ContentActions 
                activeTab={activeTab}
                content={getContentByType(combinedContent, activeTab)}
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
                <ContentDisplay 
                  content={getContentByType(combinedContent, 'lld')} 
                  contentType="lld" 
                />
              </TabsContent>
              <TabsContent value="code" className="mt-0">
                <ContentDisplay 
                  content={getContentByType(combinedContent, 'code')} 
                  contentType="code" 
                />
              </TabsContent>
              <TabsContent value="tests" className="mt-0">
                <ContentDisplay 
                  content={getContentByType(combinedContent, 'tests')} 
                  contentType="tests" 
                />
              </TabsContent>
              <TabsContent value="testcases" className="mt-0">
                <ContentDisplay 
                  content={getContentByType(combinedContent, 'testcases')} 
                  contentType="testcases" 
                />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default StoryGenerateContent;
