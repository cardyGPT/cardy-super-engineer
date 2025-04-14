
import React from 'react';
import { ContentType } from '../ContentDisplay';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Code, TestTube, FileCode } from "lucide-react";

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
    <TabsList>
      <TabsTrigger value="lld" disabled={!hasLldContent}>
        <FileText className="h-4 w-4 mr-2 text-blue-600" />
        LLD
      </TabsTrigger>
      <TabsTrigger value="code" disabled={!hasCodeContent}>
        <Code className="h-4 w-4 mr-2 text-green-600" />
        Code
      </TabsTrigger>
      <TabsTrigger value="tests" disabled={!hasTestsContent}>
        <TestTube className="h-4 w-4 mr-2 text-purple-600" />
        Tests
      </TabsTrigger>
      <TabsTrigger value="testcases" disabled={!hasTestCasesContent}>
        <FileCode className="h-4 w-4 mr-2 text-orange-600" />
        Test Cases
      </TabsTrigger>
    </TabsList>
  );
};

export default ContentTabs;
