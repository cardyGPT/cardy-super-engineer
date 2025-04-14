
import React from 'react';
import { Button } from "@/components/ui/button";
import { BookOpen, Code, TestTube, FileCheck } from "lucide-react";
import LoadingContent from './LoadingContent';

interface GenerateButtonsProps {
  onGenerate: (type: 'lld' | 'code' | 'tests' | 'test_cases' | 'all') => void;
  isGenerating: Record<string, boolean>;
  contentLoading: boolean;
}

const GenerateButtons: React.FC<GenerateButtonsProps> = ({
  onGenerate,
  isGenerating,
  contentLoading
}) => {
  const getButtonColor = (type: string) => {
    switch (type) {
      case 'lld':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'code':
        return 'bg-green-500 hover:bg-green-600';
      case 'tests':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'test_cases':
        return 'bg-amber-500 hover:bg-amber-600';
      default:
        return '';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Button
        onClick={() => onGenerate('lld')}
        disabled={isGenerating.lld || contentLoading}
        className={getButtonColor('lld')}
      >
        {isGenerating.lld ? (
          <LoadingContent small isLoading={true} inline />
        ) : (
          <>
            <BookOpen className="mr-2 h-4 w-4" />
            Generate LLD
          </>
        )}
      </Button>
      
      <Button
        onClick={() => onGenerate('code')}
        disabled={isGenerating.code || contentLoading}
        className={getButtonColor('code')}
      >
        {isGenerating.code ? (
          <LoadingContent small isLoading={true} inline />
        ) : (
          <>
            <Code className="mr-2 h-4 w-4" />
            Generate Code
          </>
        )}
      </Button>
      
      <Button
        onClick={() => onGenerate('tests')}
        disabled={isGenerating.tests || contentLoading}
        className={getButtonColor('tests')}
      >
        {isGenerating.tests ? (
          <LoadingContent small isLoading={true} inline />
        ) : (
          <>
            <TestTube className="mr-2 h-4 w-4" />
            Generate Tests
          </>
        )}
      </Button>
      
      <Button
        onClick={() => onGenerate('test_cases')}
        disabled={isGenerating.test_cases || contentLoading}
        className={getButtonColor('test_cases')}
      >
        {isGenerating.test_cases ? (
          <LoadingContent small isLoading={true} inline />
        ) : (
          <>
            <FileCheck className="mr-2 h-4 w-4" />
            Generate Test Cases
          </>
        )}
      </Button>
    </div>
  );
};

export default GenerateButtons;
