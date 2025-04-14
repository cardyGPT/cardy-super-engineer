
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Markdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Code, TestTube, FileCheck } from "lucide-react";
import ContentActions from './ContentActions';

interface ContentViewProps {
  content: string | undefined;
  contentType: 'lld' | 'code' | 'tests' | 'test_cases';
  isCopied: Record<string, boolean>;
  isPushing: Record<string, boolean>;
  onCopy: (content: string, type: string) => void;
  onPushToJira: (content: string, type: string) => void;
  onPushToGDrive: (content: string, type: string) => void;
  onPushToBitbucket: (content: string, type: string) => void;
  onDownloadPDF: (content: string, type: string) => void;
}

const ContentView: React.FC<ContentViewProps> = ({
  content,
  contentType,
  isCopied,
  isPushing,
  onCopy,
  onPushToJira,
  onPushToGDrive,
  onPushToBitbucket,
  onDownloadPDF
}) => {
  const getIcon = () => {
    switch (contentType) {
      case 'lld':
        return <FileText className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'tests':
        return <TestTube className="h-4 w-4" />;
      case 'test_cases':
        return <FileCheck className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (contentType) {
      case 'lld':
        return 'No LLD content';
      case 'code':
        return 'No code content';
      case 'tests':
        return 'No tests content';
      case 'test_cases':
        return 'No test cases content';
    }
  };

  const getDescription = () => {
    switch (contentType) {
      case 'lld':
        return 'Generate LLD content to see it here.';
      case 'code':
        return 'Generate code content to see it here.';
      case 'tests':
        return 'Generate tests content to see it here.';
      case 'test_cases':
        return 'Generate test cases content to see it here.';
    }
  };

  const renderContent = (contentText: string | undefined) => {
    if (!contentText) return null;
    return (
      <ScrollArea className="h-[60vh] w-full rounded border p-4">
        <Markdown>{contentText}</Markdown>
      </ScrollArea>
    );
  };

  if (!content) {
    return (
      <Alert>
        {getIcon()}
        <AlertTitle>{getTitle()}</AlertTitle>
        <AlertDescription>
          {getDescription()}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {renderContent(content)}
      <ContentActions
        content={content}
        contentType={contentType}
        isCopied={isCopied}
        isPushing={isPushing}
        onCopy={onCopy}
        onPushToJira={onPushToJira}
        onPushToGDrive={onPushToGDrive}
        onPushToBitbucket={onPushToBitbucket}
        onDownloadPDF={onDownloadPDF}
      />
    </>
  );
};

export default ContentView;
