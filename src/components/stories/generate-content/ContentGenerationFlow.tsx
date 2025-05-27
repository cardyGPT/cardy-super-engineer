
import React, { useState } from 'react';
import { JiraTicket, JiraGenerationResponse, ContentType } from '@/types/jira';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import ContentDisplay from '../ContentDisplay';
import { getContentByType } from './utils';

interface ContentGenerationFlowProps {
  selectedTicket: JiraTicket;
  generatedContent: JiraGenerationResponse | null;
  isGenerating: boolean;
  currentStep: string;
  setCurrentStep: (step: string) => void;
  onGenerate: (type: ContentType) => Promise<void>;
  onPushToJira: (content: string) => Promise<boolean>;
  onSaveContent: (content: string) => Promise<boolean>;
}

const ContentGenerationFlow: React.FC<ContentGenerationFlowProps> = ({
  selectedTicket,
  generatedContent,
  isGenerating,
  onGenerate
}) => {
  const [activeType, setActiveType] = useState<ContentType>('lld');

  const handleGenerateLLD = async () => {
    try {
      setActiveType('lld');
      await onGenerate('lld');
    } catch (error) {
      console.error('Error generating LLD:', error);
    }
  };

  const hasLLDContent = Boolean(getContentByType(generatedContent, 'lld'));
  const currentContent = getContentByType(generatedContent, activeType);

  return (
    <div className="space-y-6">
      {/* Generation Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Content for {selectedTicket.key}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateLLD}
              disabled={isGenerating}
              variant={hasLLDContent ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-auto p-4"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              <span className="text-sm">Generate LLD</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Display */}
      {hasLLDContent && (
        <Card>
          <CardContent className="p-6">
            <ContentDisplay 
              content={currentContent} 
              contentType={activeType} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentGenerationFlow;
