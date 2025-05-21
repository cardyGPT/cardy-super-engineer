
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, FileOutput, Save, Send, MessageSquare } from "lucide-react";
import { ContentType } from '../ContentDisplay';
import { Steps, Step } from "@/components/ui/steps";
import { JiraGenerationResponse, JiraTicket } from '@/types/jira';
import ContentDisplay from '../ContentDisplay';
import ContentActions from './ContentActions';
import PromptInput from './PromptInput';
import DocumentExportFormatter from './DocumentExportFormatter';
import { useToast } from '@/hooks/use-toast';
import { downloadAsPDF } from '@/utils/exportUtils';
import { exportToWord } from '@/utils/wordExportUtils';

// Define all generation steps in the flow
const GENERATION_STEPS = [
  { id: 'select', title: 'Select', subtitle: 'Choose ticket' },
  { id: 'lld', title: 'LLD', subtitle: 'Low-Level Design' },
  { id: 'code', title: 'Code', subtitle: 'Implementation' },
  { id: 'tests', title: 'Tests', subtitle: 'Unit Tests' },
  { id: 'testcases', title: 'Test Cases', subtitle: 'Manual Tests' },
  { id: 'testScripts', title: 'Test Scripts', subtitle: 'Automated Tests' }
];

interface ContentGenerationFlowProps {
  selectedTicket: JiraTicket | null;
  generatedContent: JiraGenerationResponse | null;
  currentStep: string;
  setCurrentStep: (step: string) => void;
  onGenerate: (type: ContentType) => Promise<void>;
  onSaveContent: (content: string) => Promise<boolean>;
  onPushToJira: (content: string) => Promise<boolean>;
  isGenerating: boolean;
}

const ContentGenerationFlow: React.FC<ContentGenerationFlowProps> = ({
  selectedTicket,
  generatedContent,
  currentStep,
  setCurrentStep,
  onGenerate,
  onSaveContent,
  onPushToJira,
  isGenerating
}) => {
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushingToJira, setIsPushingToJira] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false);
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  
  // Get content for the current step from generated content
  const getContentForCurrentStep = (): string | null => {
    if (!generatedContent) return null;
    
    switch (currentStep) {
      case 'lld': return generatedContent.lldContent || null;
      case 'code': return generatedContent.codeContent || null;
      case 'tests': return generatedContent.testContent || null;
      case 'testcases': return generatedContent.testCasesContent || null;
      case 'testScripts': return generatedContent.testScriptsContent || null;
      default: return null;
    }
  };
  
  // Handle regeneration of content for current step
  const handleRegenerate = async () => {
    if (currentStep === 'select' || !selectedTicket) return;
    
    setIsRegenerating(true);
    try {
      await onGenerate(currentStep as ContentType);
      toast({
        title: "Content Regenerated",
        description: `${currentStep.toUpperCase()} content has been regenerated successfully.`
      });
    } catch (error) {
      console.error("Error regenerating content:", error);
      toast({
        title: "Regeneration Error",
        description: "Failed to regenerate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Handle saving content to database
  const handleSave = async () => {
    const content = getContentForCurrentStep();
    if (!content) return;
    
    setIsSaving(true);
    try {
      const success = await onSaveContent(content);
      if (success) {
        toast({
          title: "Content Saved",
          description: `${currentStep.toUpperCase()} content has been saved successfully.`
        });
      } else {
        throw new Error("Failed to save content");
      }
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Save Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle pushing content to Jira
  const handlePushToJira = async () => {
    const content = getContentForCurrentStep();
    if (!content || !selectedTicket) return;
    
    setIsPushingToJira(true);
    try {
      const success = await onPushToJira(content);
      if (success) {
        toast({
          title: "Content Pushed to Jira",
          description: `${currentStep.toUpperCase()} content has been pushed to Jira ticket ${selectedTicket.key}.`
        });
      } else {
        throw new Error("Failed to push content to Jira");
      }
    } catch (error) {
      console.error("Error pushing to Jira:", error);
      toast({
        title: "Jira Error",
        description: "Failed to push content to Jira. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPushingToJira(false);
    }
  };
  
  // Handle export to PDF with proper formatting
  const handleExportPDF = async () => {
    if (!documentRef.current || !selectedTicket) return;
    
    setIsExporting(true);
    try {
      const fileName = `${selectedTicket.key}_${currentStep}`;
      const success = await downloadAsPDF(documentRef.current, fileName);
      
      if (success) {
        toast({
          title: "PDF Exported",
          description: `${currentStep.toUpperCase()} document has been exported successfully.`
        });
      } else {
        throw new Error("Failed to export PDF");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle export to Word format
  const handleExportWord = async () => {
    if (!documentRef.current || !selectedTicket) return;
    
    setIsExportingWord(true);
    try {
      const content = getContentForCurrentStep();
      if (!content) throw new Error("No content to export");
      
      const fileName = `${selectedTicket.key}_${currentStep}`;
      const logoUrl = '/cardinality-logo.png';
      
      const success = await exportToWord(content, fileName, logoUrl);
      
      if (success) {
        toast({
          title: "Word Document Exported",
          description: `${currentStep.toUpperCase()} document has been exported as Word document.`
        });
      } else {
        throw new Error("Failed to export Word document");
      }
    } catch (error) {
      console.error("Error exporting Word document:", error);
      toast({
        title: "Export Error",
        description: "Failed to export Word document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExportingWord(false);
    }
  };
  
  // Handle custom prompt submission
  const handleSubmitPrompt = async (prompt: string) => {
    if (currentStep === 'select' || !selectedTicket) return;
    
    setIsSubmittingPrompt(true);
    try {
      // Custom prompt would be handled by onGenerate with a special parameter
      // For now, just call the regular generate function
      await onGenerate(currentStep as ContentType);
      
      toast({
        title: "Content Updated",
        description: `${currentStep.toUpperCase()} content has been updated based on your prompt.`
      });
      setShowPromptInput(false);
    } catch (error) {
      console.error("Error processing custom prompt:", error);
      toast({
        title: "Prompt Error",
        description: "Failed to process your prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingPrompt(false);
    }
  };
  
  // Determine if a step is completed
  const isStepCompleted = (stepId: string): boolean => {
    if (!generatedContent) return false;
    
    switch (stepId) {
      case 'select': return !!selectedTicket;
      case 'lld': return !!generatedContent.lldContent;
      case 'code': return !!generatedContent.codeContent;
      case 'tests': return !!generatedContent.testContent;
      case 'testcases': return !!generatedContent.testCasesContent;
      case 'testScripts': return !!generatedContent.testScriptsContent;
      default: return false;
    }
  };
  
  // Get the status for each step in the flow
  const getStepStatus = (stepId: string): { completed: boolean; active: boolean; processing: boolean } => {
    return {
      active: currentStep === stepId,
      completed: isStepCompleted(stepId),
      processing: currentStep === stepId && isGenerating
    };
  };
  
  const currentContent = getContentForCurrentStep();
  const isCurrentStepContentView = currentStep !== 'select';
  const hasContent = !!currentContent;
  
  return (
    <div className="space-y-6">
      {/* Step progress indicator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Generate From Jira Stories - Generation Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6 overflow-x-auto py-2">
            <Steps className="gap-4 md:gap-6">
              {GENERATION_STEPS.map((step, idx) => {
                const status = getStepStatus(step.id);
                
                // Determine the color scheme based on status
                let colorClass = ""; // Default
                if (status.completed) colorClass = "bg-green-500 text-white border-green-500";
                else if (status.processing) colorClass = "bg-blue-500 text-white border-blue-500";
                else if (!status.completed && status.active) colorClass = "bg-orange-500 text-white border-orange-500";
                
                return (
                  <Step 
                    key={step.id}
                    index={idx}
                    active={status.active}
                    completed={status.completed}
                    label={step.title}
                    subtitle={step.subtitle}
                    onClick={() => {
                      // Only allow navigation to steps that are available
                      if (step.id === 'select' || selectedTicket) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`cursor-pointer ${status.active ? colorClass : ""}`}
                  />
                );
              })}
            </Steps>
          </div>

          <div className="flex justify-center mt-4">
            {currentStep !== 'select' && selectedTicket && (
              <Button
                variant="default"
                onClick={() => onGenerate(currentStep as ContentType)}
                disabled={isGenerating || isRegenerating}
                className="mx-auto"
              >
                {isGenerating || isRegenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating {GENERATION_STEPS.find(s => s.id === currentStep)?.title || currentStep.toUpperCase()}...
                  </>
                ) : (
                  <>
                    Generate {GENERATION_STEPS.find(s => s.id === currentStep)?.title || currentStep.toUpperCase()}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Custom prompt input */}
      {showPromptInput && currentStep !== 'select' && (
        <Card>
          <CardContent className="pt-6">
            <PromptInput
              contentType={currentStep as ContentType}
              onSubmitPrompt={handleSubmitPrompt}
              isSubmitting={isSubmittingPrompt}
              onClose={() => setShowPromptInput(false)}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Content display */}
      {isCurrentStepContentView && selectedTicket && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>{GENERATION_STEPS.find(s => s.id === currentStep)?.title || currentStep.toUpperCase()} Content</CardTitle>
            
            {hasContent && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRegenerating}
                  onClick={handleRegenerate}
                >
                  {isRegenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Regenerate
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPromptInput(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Custom Prompt
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  onClick={handleExportPDF}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExportingWord}
                  onClick={handleExportWord}
                >
                  <FileOutput className="h-4 w-4 mr-1" />
                  Word
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPushingToJira}
                  onClick={handlePushToJira}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Jira
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Regular content display for editing */}
            <div className="mb-4" ref={contentRef}>
              <ContentDisplay
                content={currentContent}
                contentType={currentStep as ContentType}
              />
            </div>
            
            {/* Hidden formatted document for export */}
            <div className="hidden">
              <div ref={documentRef}>
                {currentContent && selectedTicket && (
                  <DocumentExportFormatter
                    content={currentContent}
                    contentType={currentStep as ContentType}
                    ticket={selectedTicket}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentGenerationFlow;
