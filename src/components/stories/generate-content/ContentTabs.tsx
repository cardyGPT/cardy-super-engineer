
import React from 'react';
import { ContentType } from '../ContentDisplay';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Code, TestTube, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContentTabsProps {
  activeTab: ContentType;
  onChange: (value: ContentType) => void;
  hasLldContent: boolean;
  hasCodeContent: boolean;
  hasTestsContent: boolean;
  hasTestCasesContent: boolean;
}

const ContentTabs: React.FC<ContentTabsProps> = ({
  activeTab,
  onChange,
  hasLldContent,
  hasCodeContent,
  hasTestsContent,
  hasTestCasesContent
}) => {
  return (
    <TabsList className="border">
      <TabsTrigger 
        value="lld" 
        onClick={() => onChange('lld')}
        disabled={!hasLldContent}
        className="gap-1"
      >
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline">LLD</span>
        {hasLldContent && (
          <Badge variant="secondary" className="ml-1 h-5 px-1 py-0">
            <span className="text-xs">✓</span>
          </Badge>
        )}
      </TabsTrigger>
      
      <TabsTrigger 
        value="code" 
        onClick={() => onChange('code')}
        disabled={!hasCodeContent}
        className="gap-1"
      >
        <Code className="h-4 w-4" />
        <span className="hidden sm:inline">Code</span>
        {hasCodeContent && (
          <Badge variant="secondary" className="ml-1 h-5 px-1 py-0">
            <span className="text-xs">✓</span>
          </Badge>
        )}
      </TabsTrigger>
      
      <TabsTrigger 
        value="tests" 
        onClick={() => onChange('tests')}
        disabled={!hasTestsContent}
        className="gap-1"
      >
        <TestTube className="h-4 w-4" />
        <span className="hidden sm:inline">Tests</span>
        {hasTestsContent && (
          <Badge variant="secondary" className="ml-1 h-5 px-1 py-0">
            <span className="text-xs">✓</span>
          </Badge>
        )}
      </TabsTrigger>
      
      <TabsTrigger 
        value="testcases" 
        onClick={() => onChange('testcases')}
        disabled={!hasTestCasesContent}
        className="gap-1"
      >
        <FileCode className="h-4 w-4" />
        <span className="hidden sm:inline">Test Cases</span>
        {hasTestCasesContent && (
          <Badge variant="secondary" className="ml-1 h-5 px-1 py-0">
            <span className="text-xs">✓</span>
          </Badge>
        )}
      </TabsTrigger>
    </TabsList>
  );
};

export default ContentTabs;
