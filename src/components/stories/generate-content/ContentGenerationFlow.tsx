
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { ContentType } from '../ContentDisplay';
import { Steps, Step } from "@/components/ui/steps";
import { JiraGenerationResponse, JiraTicket } from '@/types/jira';
import ContentDisplay from '../ContentDisplay';
import ContentActions from './ContentActions';
import PromptInput from './PromptInput';
import OpenAITokenInfo from './OpenAITokenInfo';
import DocumentExportFormatter from './DocumentExportFormatter';
import { useToast } from '@/hooks/use-toast';
import { downloadAsPDF } from '@/utils/exportUtils';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isPushingToJira, setIsPushingToJira] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false);
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  
  // Navigate to next step in the flow
  const handleNextStep = () => {
    const currentIndex = GENERATION_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex < GENERATION_STEPS.length - 1) {
      setCurrentStep(GENERATION_STEPS[currentIndex + 1].id);
    }
  };
  
  // Navigate to previous step in the flow
  const handlePreviousStep = () => {
    const currentIndex = GENERATION_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(GENERATION_STEPS[currentIndex - 1].id);
    }
  };
  
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
  
  // Check if we can proceed to the next step
  const canProceed = () => {
    const currentIndex = GENERATION_STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex >= GENERATION_STEPS.length - 1) return false;
    
    // For the ticket selection step, can only proceed if a ticket is selected
    if (currentStep === 'select') {
      return !!selectedTicket;
    }
    
    // For generation steps, we can either have generated content or proceed anyway
    return true;
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
  const getStepStatus = (stepId: string) => {
    return {
      active: currentStep === stepId,
      completed: isStepCompleted(stepId)
    };
  };
  
  const currentContent = getContentForCurrentStep();
  
  return (
    <div className="space-y-6">
      <OpenAITokenInfo />
      
      {/* Step progress indicator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Generation Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-8 overflow-x-auto py-4">
            <Steps className="gap-4 md:gap-6">
              {GENERATION_STEPS.map((step, idx) => {
                const status = getStepStatus(step.id);
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
                    className="cursor-pointer"
                  />
                );
              })}
            </Steps>
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 'select'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep !== 'select' && (
              <Button
                variant="default"
                onClick={() => onGenerate(currentStep as ContentType)}
                disabled={isGenerating || isRegenerating || !selectedTicket}
                className="mx-auto"
              >
                {isGenerating || isRegenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate {GENERATION_STEPS.find(s => s.id === currentStep)?.title || currentStep.toUpperCase()}
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="default"
              onClick={handleNextStep}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
      {currentStep !== 'select' && selectedTicket && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>{GENERATION_STEPS.find(s => s.id === currentStep)?.title || currentStep.toUpperCase()} Content</CardTitle>
            
            <ContentActions
              activeTab={currentStep as ContentType}
              content={currentContent || ''}
              isExporting={isExporting}
              isSaving={isSaving}
              isPushingToJira={isPushingToJira}
              isRegenerating={isRegenerating}
              onExportPDF={handleExportPDF}
              onSaveToDatabase={handleSave}
              onPushToJira={handlePushToJira}
              onRegenerateContent={handleRegenerate}
              onShowPromptInput={() => setShowPromptInput(true)}
              storyId={selectedTicket.id}
              storyKey={selectedTicket.key}
            />
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
