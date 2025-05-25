
import React, { useState, useRef, useEffect } from 'react';
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse, ProjectContextData } from '@/types/jira';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { useToast } from "@/hooks/use-toast";
import ContentDisplay, { ContentType } from '../ContentDisplay';
import { getContentByType, getStatusMessage } from './utils';
import GenerateButtons from './GenerateButtons';
import ContentTabs from './ContentTabs';
import ContentActions from './ContentActions';
import PromptInput from './PromptInput';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AlertCircle, CheckCircle, Info, Loader2, MessageSquare } from "lucide-react";
import { useStories } from '@/contexts/StoriesContext';
import { Button } from "@/components/ui/button";

interface ExistingArtifacts {
  lldContent: string | null;
  codeContent: string | null;
  testContent: string | null;
  testCasesContent: string | null;
  testScriptsContent: string | null;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingContentType, setGeneratingContentType] = useState<ContentType | null>(null);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false);
  const { toast } = useToast();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const { saveContentToDatabase } = useStories();
  
  // Effect to update the content when ticket changes or when artifacts are loaded
  useEffect(() => {
    // Reset any in-memory content when the ticket changes
    if (existingArtifacts && 
        (existingArtifacts.lldContent || 
         existingArtifacts.codeContent || 
         existingArtifacts.testContent || 
         existingArtifacts.testCasesContent ||
         existingArtifacts.testScriptsContent)) {
      // If we have stored content, set the active tab to the first available content
      if (existingArtifacts.lldContent) {
        setActiveTab('lld');
      } else if (existingArtifacts.codeContent) {
        setActiveTab('code');
      } else if (existingArtifacts.testContent) {
        setActiveTab('tests');
      } else if (existingArtifacts.testCasesContent) {
        setActiveTab('testcases');
      } else if (existingArtifacts.testScriptsContent) {
        setActiveTab('testScripts');
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
    combinedContent.testCasesContent ||
    combinedContent.testScriptsContent
  );
  
  const handleGenerate = async (type: ContentType) => {
    try {
      // Set which content type is being generated
      setGeneratingContentType(type);
      
      const request: JiraGenerationRequest = {
        type: type as 'lld' | 'code' | 'tests' | 'testcases' | 'testScripts',
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
        
        if ((type === 'tests' || type === 'testcases' || type === 'testScripts') && combinedContent.codeContent) {
          request.additionalContext = {
            ...request.additionalContext,
            codeContent: combinedContent.codeContent
          };
        }
        
        if ((type === 'testcases' || type === 'testScripts') && combinedContent.testContent) {
          request.additionalContext = {
            ...request.additionalContext,
            testContent: combinedContent.testContent
          };
        }
        
        if (type === 'testScripts' && combinedContent.testCasesContent) {
          request.additionalContext = {
            ...request.additionalContext,
            testCasesContent: combinedContent.testCasesContent
          };
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
  
  const handleSubmitPrompt = async (prompt: string) => {
    setIsSubmittingPrompt(true);
    try {
      const request: JiraGenerationRequest = {
        type: activeTab as 'lld' | 'code' | 'tests' | 'testcases' | 'testScripts',
        jiraTicket: ticket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
        additionalContext: {
          customPrompt: prompt
        }
      };
      
      // Add current content to provide context for refinement
      const currentContent = getContentByType(combinedContent, activeTab);
      if (currentContent) {
        request.additionalContext.currentContent = currentContent;
      }
      
      // Add previous artifacts for context
      if (activeTab !== 'lld' && combinedContent.lldContent) {
        request.additionalContext.lldContent = combinedContent.lldContent;
      }
      
      if ((activeTab === 'tests' || activeTab === 'testcases' || activeTab === 'testScripts') && combinedContent.codeContent) {
        request.additionalContext.codeContent = combinedContent.codeContent;
      }
      
      if ((activeTab === 'testcases' || activeTab === 'testScripts') && combinedContent.testContent) {
        request.additionalContext.testContent = combinedContent.testContent;
      }
      
      if (activeTab === 'testScripts' && combinedContent.testCasesContent) {
        request.additionalContext.testCasesContent = combinedContent.testCasesContent;
      }
      
      await onGenerate(request);
      
      toast({
        title: "Content Updated",
        description: `${activeTab.toUpperCase()} content has been updated based on your prompt.`,
      });
      
      setShowPromptInput(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || `Failed to update content based on prompt.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPrompt(false);
    }
  };
  
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    try {
      // Generate in specific sequence: LLD -> Code -> Tests -> TestCases -> TestScripts
      const types: ContentType[] = ['lld', 'code', 'tests', 'testcases', 'testScripts'];
      
      for (const type of types) {
        setGeneratingContentType(type);
        
        const request: JiraGenerationRequest = {
          type: type as 'lld' | 'code' | 'tests' | 'testcases' | 'testScripts',
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
          
          if ((type === 'tests' || type === 'testcases' || type === 'testScripts') && 
              (combinedContent.codeContent || generatedContent?.codeContent)) {
            request.additionalContext = {
              ...request.additionalContext,
              codeContent: combinedContent.codeContent || generatedContent?.codeContent
            };
          }
          
          if ((type === 'testcases' || type === 'testScripts') && 
              (combinedContent.testContent || generatedContent?.testContent)) {
            request.additionalContext = {
              ...request.additionalContext,
              testContent: combinedContent.testContent || generatedContent?.testContent
            };
          }
          
          if (type === 'testScripts' && 
              (combinedContent.testCasesContent || generatedContent?.testCasesContent)) {
            request.additionalContext = {
              ...request.additionalContext,
              testCasesContent: combinedContent.testCasesContent || generatedContent?.testCasesContent
            };
          }
        }
        
        await onGenerate(request);
      }
      
      setActiveTab('lld');
      
      toast({
        title: "All Content Generated",
        description: "LLD, Code, Unit Tests, Test Cases, and Test Scripts content has been generated successfully.",
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
  
  const handleSaveToDatabase = async () => {
    const content = getContentByType(combinedContent, activeTab);
    
    if (!content) {
      toast({
        title: "Error",
        description: "No content to save.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Save the content to the database
      const success = await saveContentToDatabase(activeTab, content);
      
      if (success) {
        toast({
          title: "Content Saved",
          description: `${activeTab.toUpperCase()} content has been saved to database.`,
          variant: "success",
        });
      } else {
        throw new Error("Failed to save content to database.");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save content to database.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
    if (!hasContentType('tests')) return 'tests';
    if (!hasContentType('testcases')) return 'testcases';
    if (!hasContentType('testScripts')) return 'testScripts';
    return null;
  };

  // Show information about existing content and generation sequence
  const renderStatusInfo = () => {
    if (isGenerating || isGeneratingAll) {
      return (
        <Alert className="mb-4">
          <div className="flex items-start">
            <Loader2 className="h-4 w-4 mr-2 animate-spin mt-1" />
            <div>
              <AlertTitle>
                {generatingContentType === 'lld' ? 'Step 1: Low-Level Design (LLD)' : 
                 generatingContentType === 'code' ? 'Step 2: Code Generation' :
                 generatingContentType === 'tests' ? 'Step 3: Unit Tests (Jest/Jasmine)' :
                 generatingContentType === 'testcases' ? 'Step 4: Test Cases' :
                 generatingContentType === 'testScripts' ? 'Step 5: Test Scripts (Playwright/JMeter)' :
                 'Generating Content'}
              </AlertTitle>
              <AlertDescription className="whitespace-pre-line">
                {generatingContentType ? getStatusMessage(generatingContentType) : 'Generating content...'}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      );
    }
    
    if (!hasAnyContent) {
      return (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Getting Started</AlertTitle>
          <AlertDescription>
            Start by generating the Low-Level Design (LLD) for this ticket. Once the LLD is created, you can proceed 
            to generate implementation code, unit tests, test cases, and test scripts in sequence.
          </AlertDescription>
        </Alert>
      );
    }
    
    const nextType = getNextContentType();
    if (nextType) {
      const nextTypeLabel = nextType === 'lld' ? 'Low-Level Design' :
                            nextType === 'code' ? 'Implementation Code' :
                            nextType === 'tests' ? 'Unit Tests' :
                            nextType === 'testcases' ? 'Test Cases' : 'Test Scripts';
      
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
      
      {showPromptInput && hasContentType(activeTab) && (
        <PromptInput
          contentType={activeTab}
          onSubmitPrompt={handleSubmitPrompt}
          isSubmitting={isSubmittingPrompt}
          onClose={() => setShowPromptInput(false)}
        />
      )}
      
      <div className="flex justify-between mb-2">
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
          hasTestScriptsContent={hasContentType('testScripts')}
        />
        
        {/* Prompt button */}
        {hasAnyContent && hasContentType(activeTab) && (
          <Button 
            variant="outline" 
            size="icon" 
            className="border-blue-200 hover:bg-blue-50"
            onClick={() => setShowPromptInput(!showPromptInput)}
            disabled={isGenerating || isGeneratingAll || isSubmittingPrompt}
          >
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </Button>
        )}
      </div>
      
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
                hasTestScriptsContent={hasContentType('testScripts')}
              />
              
              <ContentActions 
                activeTab={activeTab}
                content={getContentByType(combinedContent, activeTab) || ''}
                isExporting={isExporting}
                isSaving={isSaving}
                isPushingToJira={isPushingToJira}
                onExportPDF={exportToPDF}
                onSaveToDatabase={handleSaveToDatabase}
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
              <TabsContent value="testScripts" className="mt-0">
                <ContentDisplay 
                  content={getContentByType(combinedContent, 'testScripts')} 
                  contentType="testScripts" 
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
