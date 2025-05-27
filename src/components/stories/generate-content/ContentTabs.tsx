import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Code, TestTube, ClipboardList, Play } from 'lucide-react';
import { ContentType } from '@/types/jira';

interface ContentTabsProps {
  activeTab: ContentType;
  onChange: (tab: ContentType) => void;
  hasLldContent?: boolean;
  hasCodeContent?: boolean;
  hasTestsContent?: boolean;
  hasTestCasesContent?: boolean;
  hasTestScriptsContent?: boolean;
}

const ContentTabs: React.FC<ContentTabsProps> = ({
  activeTab,
  onChange,
  hasLldContent = false,
  hasCodeContent = false,
  hasTestsContent = false,
  hasTestCasesContent = false,
  hasTestScriptsContent = false
}) => {
  return (
    <TabsList className="grid grid-cols-5 w-full">
      {hasLldContent && (
        <TabsTrigger 
          value="lld" 
          onClick={() => onChange('lld')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          LLD
        </TabsTrigger>
      )}
      
      {hasCodeContent && (
        <TabsTrigger 
          value="code" 
          onClick={() => onChange('code')}
          className="flex items-center gap-2"
        >
          <Code className="h-4 w-4" />
          Code
        </TabsTrigger>
      )}
      
      {hasTestsContent && (
        <TabsTrigger 
          value="tests" 
          onClick={() => onChange('tests')}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          Tests
        </TabsTrigger>
      )}
      
      {hasTestCasesContent && (
        <TabsTrigger 
          value="testcases" 
          onClick={() => onChange('testcases')}
          className="flex items-center gap-2"
        >
          <ClipboardList className="h-4 w-4" />
          Test Cases
        </TabsTrigger>
      )}
      
      {hasTestScriptsContent && (
        <TabsTrigger 
          value="testScripts" 
          onClick={() => onChange('testScripts')}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          Test Scripts
        </TabsTrigger>
      )}
    </TabsList>
  );
};

export default ContentTabs;
