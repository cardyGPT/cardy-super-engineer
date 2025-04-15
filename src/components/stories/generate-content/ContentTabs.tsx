
import React from 'react';
import { ContentType } from '../ContentDisplay';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <TabsList className="grid grid-cols-4 w-auto">
      <TabsTrigger 
        value="lld" 
        disabled={!hasLldContent}
        onClick={() => onChange('lld')}
      >
        LLD
      </TabsTrigger>
      <TabsTrigger 
        value="code" 
        disabled={!hasCodeContent}
        onClick={() => onChange('code')}
      >
        Code
      </TabsTrigger>
      <TabsTrigger 
        value="testcases" 
        disabled={!hasTestCasesContent}
        onClick={() => onChange('testcases')}
      >
        Test Cases
      </TabsTrigger>
      <TabsTrigger 
        value="tests" 
        disabled={!hasTestsContent}
        onClick={() => onChange('tests')}
      >
        Tests
      </TabsTrigger>
    </TabsList>
  );
};

export default ContentTabs;
