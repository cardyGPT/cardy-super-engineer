
import React, { useState } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { ProjectContextData } from '@/types/jira';
import { ContentType } from './ContentDisplay';
import { Card } from '@/components/ui/card';
import StoryDetail from './StoryDetail';
import StoryDetailEmpty from './StoryDetailEmpty';
import ContentGenerationFlow from './generate-content/ContentGenerationFlow';
import { useToast } from '@/hooks/use-toast';

interface StoryDetailWrapperProps {
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
  activeTab?: ContentType;
  setActiveTab?: (tab: ContentType) => void;
}

const StoryDetailWrapper: React.FC<StoryDetailWrapperProps> = ({
  projectContext,
  selectedDocuments,
  projectContextData,
  activeTab = 'lld',
  setActiveTab
}) => {
  const { selectedTicket, generateContent, pushToJira, generatedContent, saveContentToDatabase } = useStories();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>(selectedTicket ? activeTab || 'lld' : 'select');
  const { toast } = useToast();
  
  // Sync currentStep with activeTab from parent
  React.useEffect(() => {
    if (activeTab && activeTab !== currentStep) {
      setCurrentStep(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  
  // Sync activeTab in parent with currentStep
  React.useEffect(() => {
    if (setActiveTab && currentStep !== activeTab && (
      currentStep === 'lld' || 
      currentStep === 'code' || 
      currentStep === 'tests' || 
      currentStep === 'testcases' || 
      currentStep === 'testScripts'
    )) {
      setActiveTab(currentStep as ContentType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);
  
  const handleGenerate = async (type: ContentType) => {
    if (!selectedTicket) {
      toast({
        title: "Error",
        description: "No ticket selected",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      // Build context from previous steps for chaining
      const additionalContext: Record<string, any> = {};
      
      // Add previous artifacts to context for subsequent generations
      if (type !== 'lld' && generatedContent?.lldContent) {
        additionalContext.lldContent = generatedContent.lldContent;
      }
      
      if ((type === 'tests' || type === 'testcases' || type === 'testScripts') && generatedContent?.codeContent) {
        additionalContext.codeContent = generatedContent.codeContent;
      }
      
      if ((type === 'testcases' || type === 'testScripts') && generatedContent?.testContent) {
        additionalContext.testContent = generatedContent.testContent;
      }
      
      if (type === 'testScripts' && generatedContent?.testCasesContent) {
        additionalContext.testCasesContent = generatedContent.testCasesContent;
      }
      
      await generateContent({
        type,
        jiraTicket: selectedTicket,
        projectContext: projectContext || undefined,
        selectedDocuments: selectedDocuments || [],
        additionalContext
      });
    } catch (err: any) {
      toast({
        title: "Generation Error",
        description: err.message || `Failed to generate ${type} content`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePushToJira = async (content: string) => {
    if (!selectedTicket) return false;
    
    try {
      return await pushToJira(selectedTicket.id, content);
    } catch (err) {
      console.error('Error pushing to Jira:', err);
      return false;
    }
  };
  
  const handleSaveContent = async (content: string) => {
    if (!selectedTicket) return false;
    
    try {
      return await saveContentToDatabase(currentStep as ContentType, content);
    } catch (err) {
      console.error('Error saving content:', err);
      return false;
    }
  };

  if (!selectedTicket) {
    return (
      <Card className="mt-6 p-6">
        <StoryDetailEmpty />
      </Card>
    );
  }
  
  return (
    <div>
      <ContentGenerationFlow
        selectedTicket={selectedTicket}
        generatedContent={generatedContent}
        isGenerating={isGenerating}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onGenerate={handleGenerate}
        onPushToJira={handlePushToJira}
        onSaveContent={handleSaveContent}
      />
      
      {/* Ticket details card - moved to bottom to focus on content generation */}
      <Card className="mt-6">
        <StoryDetail ticket={selectedTicket} />
      </Card>
    </div>
  );
};

export default StoryDetailWrapper;
