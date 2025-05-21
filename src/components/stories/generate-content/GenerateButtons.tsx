
import React from 'react';
import { ContentType } from '../ContentDisplay';
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Code, TestTube, FileCode, ActivitySquare, CheckSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GENERATION_STEPS } from './utils';

interface GenerateButtonsProps {
  onGenerate: (type: ContentType) => void;
  onGenerateAll: () => void;
  isGenerating: boolean;
  isGeneratingAll: boolean;
  activeTab: ContentType;
  generatingContentType: ContentType | null;
  hasLldContent?: boolean;
  hasCodeContent?: boolean;
  hasTestsContent?: boolean;
  hasTestCasesContent?: boolean;
  hasTestScriptsContent?: boolean;
}

const GenerateButtons: React.FC<GenerateButtonsProps> = ({
  onGenerate,
  onGenerateAll,
  isGenerating,
  isGeneratingAll,
  activeTab,
  generatingContentType,
  hasLldContent = false,
  hasCodeContent = false,
  hasTestsContent = false,
  hasTestCasesContent = false,
  hasTestScriptsContent = false
}) => {
  // Determine if a button should be disabled based on the generation sequence
  const isDisabled = (type: ContentType) => {
    // If we're generating anything, disable all buttons except the one that's generating
    if (isGenerating && generatingContentType !== type) return true;
    
    // If we're generating all, disable all buttons
    if (isGeneratingAll) return true;
    
    // Enforce the generation sequence: LLD → Code → Tests → Test Cases → Test Scripts
    // Only one button should be enabled at a time based on the current state
    
    if (type === 'lld') {
      // LLD is always available (unless something is generating)
      return false;
    }
    
    if (type === 'code') {
      // Code can only be generated after LLD
      return !hasLldContent;
    }
    
    if (type === 'tests') {
      // Tests can only be generated after Code
      return !hasCodeContent;
    }
    
    if (type === 'testcases') {
      // Test cases can only be generated after Tests
      return !hasTestsContent;
    }
    
    if (type === 'testScripts') {
      // Test scripts can only be generated after Test Cases
      return !hasTestCasesContent;
    }
    
    return false;
  };
  
  const getButtonVariant = (type: ContentType) => {
    if (type === 'lld' && hasLldContent) return 'outline'; 
    if (type === 'code' && hasCodeContent) return 'outline';
    if (type === 'tests' && hasTestsContent) return 'outline';
    if (type === 'testcases' && hasTestCasesContent) return 'outline';
    if (type === 'testScripts' && hasTestScriptsContent) return 'outline';
    return 'default';
  };
  
  const getButtonColor = (type: ContentType) => {
    // Classes to apply based on state
    if (type === 'lld' && hasLldContent) 
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
    if (type === 'code' && hasCodeContent) 
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
    if (type === 'tests' && hasTestsContent) 
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
    if (type === 'testcases' && hasTestCasesContent) 
      return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
    if (type === 'testScripts' && hasTestScriptsContent) 
      return 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100';
    
    // Default colors for generate buttons
    if (type === 'lld') return 'bg-blue-500 text-white hover:bg-blue-600';
    if (type === 'code') return 'bg-green-500 text-white hover:bg-green-600';
    if (type === 'tests') return 'bg-purple-500 text-white hover:bg-purple-600';
    if (type === 'testcases') return 'bg-orange-500 text-white hover:bg-orange-600';
    if (type === 'testScripts') return 'bg-teal-500 text-white hover:bg-teal-600';
    
    return '';
  };

  const getButtonIcon = (type: ContentType) => {
    if (isGenerating && generatingContentType === type) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    switch (type) {
      case 'lld': return <FileText className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'tests': return <TestTube className="h-4 w-4" />;
      case 'testcases': return <FileCode className="h-4 w-4" />;
      case 'testScripts': return <ActivitySquare className="h-4 w-4" />;
      default: return null;
    }
  };

  const stepLabels = {
    lld: 'Step 1: Low-Level Design',
    code: 'Step 2: Implementation Code',
    tests: 'Step 3: Unit Tests (Jest/Jasmine)',
    testcases: 'Step 4: Test Cases',
    testScripts: 'Step 5: Test Scripts (Playwright/JMeter)'
  };

  const hasContent = (type: ContentType) => {
    switch (type) {
      case 'lld': return hasLldContent;
      case 'code': return hasCodeContent;
      case 'tests': return hasTestsContent;
      case 'testcases': return hasTestCasesContent;
      case 'testScripts': return hasTestScriptsContent;
      default: return false;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getButtonVariant('lld')}
              size="icon"
              onClick={() => onGenerate('lld')}
              disabled={isDisabled('lld')}
              className={getButtonColor('lld')}
            >
              {getButtonIcon('lld')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasLldContent ? 'Regenerate LLD' : 'Generate LLD'}</p>
            <p className="text-xs text-muted-foreground">{stepLabels.lld}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getButtonVariant('code')}
              size="icon"
              onClick={() => onGenerate('code')}
              disabled={isDisabled('code')}
              className={getButtonColor('code')}
            >
              {getButtonIcon('code')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasCodeContent ? 'Regenerate Code' : 'Generate Code'}</p>
            <p className="text-xs text-muted-foreground">{stepLabels.code}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getButtonVariant('tests')}
              size="icon"
              onClick={() => onGenerate('tests')}
              disabled={isDisabled('tests')}
              className={getButtonColor('tests')}
            >
              {getButtonIcon('tests')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasTestsContent ? 'Regenerate Unit Tests' : 'Generate Unit Tests'}</p>
            <p className="text-xs text-muted-foreground">{stepLabels.tests}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getButtonVariant('testcases')}
              size="icon"
              onClick={() => onGenerate('testcases')}
              disabled={isDisabled('testcases')}
              className={getButtonColor('testcases')}
            >
              {getButtonIcon('testcases')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasTestCasesContent ? 'Regenerate Test Cases' : 'Generate Test Cases'}</p>
            <p className="text-xs text-muted-foreground">{stepLabels.testcases}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getButtonVariant('testScripts')}
              size="icon"
              onClick={() => onGenerate('testScripts')}
              disabled={isDisabled('testScripts')}
              className={getButtonColor('testScripts')}
            >
              {getButtonIcon('testScripts')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasTestScriptsContent ? 'Regenerate Test Scripts' : 'Generate Test Scripts'}</p>
            <p className="text-xs text-muted-foreground">{stepLabels.testScripts}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              onClick={onGenerateAll}
              disabled={isGeneratingAll || isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isGeneratingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckSquare className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate All</p>
            <p className="text-xs text-muted-foreground">Create all artifacts in sequence</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default GenerateButtons;
