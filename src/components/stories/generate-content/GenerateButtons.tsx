
import React from 'react';
import { ContentType } from '../ContentDisplay';
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Code, TestTube, FileCode, CheckSquare } from "lucide-react";

interface GenerateButtonsProps {
  onGenerate: (type: ContentType) => void;
  onGenerateAll: () => void;
  isGenerating: boolean;
  isGeneratingAll: boolean;
  activeTab: ContentType;
  hasLldContent?: boolean;
  hasCodeContent?: boolean;
  hasTestsContent?: boolean;
  hasTestCasesContent?: boolean;
}

const GenerateButtons: React.FC<GenerateButtonsProps> = ({
  onGenerate,
  onGenerateAll,
  isGenerating,
  isGeneratingAll,
  activeTab,
  hasLldContent = false,
  hasCodeContent = false,
  hasTestsContent = false,
  hasTestCasesContent = false
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onGenerate('lld')}
        disabled={isGenerating || isGeneratingAll}
        className={`inline-flex items-center ${
          hasLldContent 
            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isGenerating && activeTab === 'lld' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        {hasLldContent ? 'Regenerate LLD' : 'Generate LLD'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onGenerate('code')}
        disabled={isGenerating || isGeneratingAll || !hasLldContent}
        className={`inline-flex items-center ${
          hasCodeContent 
            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
            : hasLldContent ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {isGenerating && activeTab === 'code' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Code className="h-4 w-4 mr-2" />
        )}
        {hasCodeContent ? 'Regenerate Code' : 'Generate Code'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onGenerate('tests')}
        disabled={isGenerating || isGeneratingAll || !hasCodeContent}
        className={`inline-flex items-center ${
          hasTestsContent 
            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' 
            : hasCodeContent ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {isGenerating && activeTab === 'tests' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <TestTube className="h-4 w-4 mr-2" />
        )}
        {hasTestsContent ? 'Regenerate Tests' : 'Generate Tests'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onGenerate('testcases')}
        disabled={isGenerating || isGeneratingAll || !hasLldContent}
        className={`inline-flex items-center ${
          hasTestCasesContent 
            ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' 
            : hasLldContent ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {isGenerating && activeTab === 'testcases' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileCode className="h-4 w-4 mr-2" />
        )}
        {hasTestCasesContent ? 'Regenerate Test Cases' : 'Generate Test Cases'}
      </Button>
      
      <Button
        variant="default"
        size="sm"
        onClick={onGenerateAll}
        disabled={isGeneratingAll || isGenerating}
        className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700"
      >
        {isGeneratingAll ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckSquare className="h-4 w-4 mr-2" />
        )}
        Generate All
      </Button>
    </div>
  );
};

export default GenerateButtons;
