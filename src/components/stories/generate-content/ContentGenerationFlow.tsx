
import React, { useState } from 'react';
import { JiraTicket, JiraGenerationResponse } from '@/types/jira';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Code, TestTube, ClipboardList, Play, Loader2 } from 'lucide-react';
import ContentDisplay, { ContentType } from '../ContentDisplay';
import ContentActions from './ContentActions';

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
  currentStep,
  setCurrentStep,
  onGenerate,
  onPushToJira,
  onSaveContent
}) => {
  const [activeTab, setActiveTab] = useState<ContentType>('lld');

  const getContentByType = (content: JiraGenerationResponse | null, type: ContentType): string => {
    if (!content) return '';
    
    switch (type) {
      case 'lld':
        return content.lldContent || content.lld || '';
      case 'code':
        return content.codeContent || content.code || '';
      case 'tests':
        return content.testContent || content.tests || '';
      case 'testcases':
        return content.testCasesContent || '';
      case 'testScripts':
        return content.testScriptsContent || '';
      default:
        return '';
    }
  };

  const handleGenerate = async (type: ContentType) => {
    try {
      await onGenerate(type);
      setActiveTab(type);
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
    }
  };

  const hasContent = (type: ContentType): boolean => {
    return Boolean(getContentByType(generatedContent, type));
  };

  const currentContent = getContentByType(generatedContent, activeTab);

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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button
              onClick={() => handleGenerate('lld')}
              disabled={isGenerating}
              variant={hasContent('lld') ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-auto p-4"
            >
              {isGenerating && currentStep === 'lld' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              <span className="text-sm">LLD</span>
            </Button>

            <Button
              onClick={() => handleGenerate('code')}
              disabled={isGenerating}
              variant={hasContent('code') ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-auto p-4"
            >
              {isGenerating && currentStep === 'code' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Code className="h-5 w-5" />
              )}
              <span className="text-sm">Code</span>
            </Button>

            <Button
              onClick={() => handleGenerate('tests')}
              disabled={isGenerating}
              variant={hasContent('tests') ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-auto p-4"
            >
              {isGenerating && currentStep === 'tests' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <TestTube className="h-5 w-5" />
              )}
              <span className="text-sm">Tests</span>
            </Button>

            <Button
              onClick={() => handleGenerate('testcases')}
              disabled={isGenerating}
              variant={hasContent('testcases') ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-auto p-4"
            >
              {isGenerating && currentStep === 'testcases' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ClipboardList className="h-5 w-5" />
              )}
              <span className="text-sm">Test Cases</span>
            </Button>

            <Button
              onClick={() => handleGenerate('testScripts')}
              disabled={isGenerating}
              variant={hasContent('testScripts') ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-auto p-4"
            >
              {isGenerating && currentStep === 'testScripts' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              <span className="text-sm">Test Scripts</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Display */}
      {(generatedContent && (hasContent('lld') || hasContent('code') || hasContent('tests') || hasContent('testcases') || hasContent('testScripts'))) && (
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)}>
              <div className="flex justify-between items-center p-6 pb-0">
                <TabsList>
                  {hasContent('lld') && (
                    <TabsTrigger value="lld" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      LLD
                    </TabsTrigger>
                  )}
                  {hasContent('code') && (
                    <TabsTrigger value="code" className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Code
                    </TabsTrigger>
                  )}
                  {hasContent('tests') && (
                    <TabsTrigger value="tests" className="flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      Tests
                    </TabsTrigger>
                  )}
                  {hasContent('testcases') && (
                    <TabsTrigger value="testcases" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Test Cases
                    </TabsTrigger>
                  )}
                  {hasContent('testScripts') && (
                    <TabsTrigger value="testScripts" className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Test Scripts
                    </TabsTrigger>
                  )}
                </TabsList>

                <ContentActions
                  content={currentContent}
                  contentType={activeTab}
                  onPushToJira={onPushToJira}
                  onSaveContent={onSaveContent}
                />
              </div>

              <div className="p-6 pt-4">
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
                <TabsContent value="testScripts" className="mt-0">
                  <ContentDisplay content={getContentByType(generatedContent, 'testScripts')} contentType="testScripts" />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContentGenerationFlow;
