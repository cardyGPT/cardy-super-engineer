
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";
import { ContentType } from '../ContentDisplay';
import { Steps, Step } from "@/components/ui/steps";
import { GENERATION_STEPS, getNextStepId, getPreviousStepId, isStepCompleted } from "./utils";
import { JiraGenerationResponse, JiraTicket } from '@/types/jira';
import ContentExportManager from './ContentExportManager';
import ContentDisplay from '../ContentDisplay';
import OpenAITokenInfo from './OpenAITokenInfo';

interface SimplifiedGenerateInterfaceProps {
  selectedTicket: JiraTicket | null;
  generatedContent: JiraGenerationResponse | null;
  isGenerating: boolean;
  currentStep: string;
  setCurrentStep: (step: string) => void;
  onGenerate: (type: ContentType) => Promise<void>;
  onPushToJira: (content: string) => Promise<boolean>;
  onSaveContent: (content: string) => Promise<boolean>;
}

const SimplifiedGenerateInterface: React.FC<SimplifiedGenerateInterfaceProps> = ({
  selectedTicket,
  generatedContent,
  isGenerating,
  currentStep,
  setCurrentStep,
  onGenerate,
  onPushToJira,
  onSaveContent
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushingToJira, setIsPushingToJira] = useState(false);
  
  const handleNextStep = () => {
    const nextStep = getNextStepId(currentStep);
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const handlePreviousStep = () => {
    const prevStep = getPreviousStepId(currentStep);
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };

  // Check if we can proceed to the next step
  const canProceed = () => {
    // Can always go to the next step if there's one available
    const nextStep = getNextStepId(currentStep);
    if (!nextStep) return false;

    // For the ticket selection step, can only proceed if a ticket is selected
    if (currentStep === 'select') {
      return !!selectedTicket;
    }

    // For generation steps, we can either have generated content or proceed anyway
    return true;
  };
  
  const getStepStatus = (stepId: string) => {
    if (currentStep === stepId) {
      return { active: true, completed: false };
    }
    
    // Special case for the select step - it's completed if a ticket is selected
    if (stepId === 'select') {
      return { active: false, completed: !!selectedTicket };
    }
    
    // For generation steps, check if we have generated content
    if (stepId === 'lld' || stepId === 'code' || stepId === 'tests' || stepId === 'testcases' || stepId === 'testScripts') {
      const completed = isStepCompleted(generatedContent, stepId);
      return { active: false, completed };
    }
    
    return { active: false, completed: false };
  };
  
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
  
  const handlePushToJira = async (content: string) => {
    setIsPushingToJira(true);
    try {
      const result = await onPushToJira(content);
      return result;
    } finally {
      setIsPushingToJira(false);
    }
  };
  
  const handleSaveContent = async (content: string) => {
    setIsSaving(true);
    try {
      const result = await onSaveContent(content);
      return result;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleExportToWordFormat = async () => {
    setIsExporting(true);
    try {
      // Export logic will be handled by ContentExportManager
    } finally {
      setIsExporting(false);
    }
  };

  const currentContent = getContentForCurrentStep();
  
  return (
    <div className="space-y-6">
      <OpenAITokenInfo />
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Generation Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-8 overflow-x-auto py-4">
            <Steps className="gap-4 md:gap-8">
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
              disabled={!getPreviousStepId(currentStep)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep !== 'select' && (
              <Button
                variant="default"
                onClick={() => onGenerate(currentStep as ContentType)}
                disabled={isGenerating || !selectedTicket}
                className="mx-auto"
              >
                {isGenerating ? (
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
      
      {currentStep !== 'select' && selectedTicket && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>{GENERATION_STEPS.find(s => s.id === currentStep)?.title || currentStep.toUpperCase()} Content</CardTitle>
            
            {selectedTicket && (
              <ContentExportManager
                content={currentContent}
                contentType={currentStep as ContentType}
                ticket={selectedTicket}
                onPushToJira={handlePushToJira}
                onSaveContent={handleSaveContent}
                onRegenerateContent={() => onGenerate(currentStep as ContentType)}
                isExporting={isExporting}
                isSaving={isSaving}
                isPushingToJira={isPushingToJira}
                isRegenerating={isGenerating}
              />
            )}
          </CardHeader>
          <CardContent>
            <ContentDisplay
              content={currentContent}
              contentType={currentStep as ContentType}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimplifiedGenerateInterface;
