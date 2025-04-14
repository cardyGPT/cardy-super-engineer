
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
}

const GenerateButtons: React.FC<GenerateButtonsProps> = ({
  onGenerate,
  onGenerateAll,
  isGenerating,
  isGeneratingAll,
  activeTab
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onGenerate('lld')}
        disabled={isGenerating}
        className="inline-flex items-center bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
      >
        {isGenerating && activeTab === 'lld' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
        )}
        Generate LLD
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onGenerate('code')}
        disabled={isGenerating}
        className="inline-flex items-center bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
      >
        {isGenerating && activeTab === 'code' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Code className="h-4 w-4 mr-2 text-green-600" />
        )}
        Generate Code
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onGenerate('tests')}
        disabled={isGenerating}
        className="inline-flex items-center bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
      >
        {isGenerating && activeTab === 'tests' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <TestTube className="h-4 w-4 mr-2 text-purple-600" />
        )}
        Generate Tests
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onGenerate('testcases')}
        disabled={isGenerating}
        className="inline-flex items-center bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
      >
        {isGenerating && activeTab === 'testcases' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileCode className="h-4 w-4 mr-2 text-orange-600" />
        )}
        Generate Test Cases
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
