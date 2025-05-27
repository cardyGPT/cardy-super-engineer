import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Code, TestTube, ClipboardList, Play, Loader2 } from 'lucide-react';
import { ContentType } from '@/types/jira';

interface GenerateButtonsProps {
  onGenerate: (type: ContentType) => Promise<void>;
  isGenerating: boolean;
  currentGeneratingType?: ContentType | null;
  hasContent: (type: ContentType) => boolean;
}

const GenerateButtons: React.FC<GenerateButtonsProps> = ({
  onGenerate,
  isGenerating,
  currentGeneratingType,
  hasContent
}) => {
  const buttons = [
    { type: 'lld' as ContentType, icon: FileText, label: 'LLD' },
    { type: 'code' as ContentType, icon: Code, label: 'Code' },
    { type: 'tests' as ContentType, icon: TestTube, label: 'Tests' },
    { type: 'testcases' as ContentType, icon: ClipboardList, label: 'Test Cases' },
    { type: 'testScripts' as ContentType, icon: Play, label: 'Test Scripts' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {buttons.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          onClick={() => onGenerate(type)}
          disabled={isGenerating}
          variant={hasContent(type) ? 'default' : 'outline'}
          className="flex flex-col items-center gap-2 h-auto p-4"
        >
          {isGenerating && currentGeneratingType === type ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
          <span className="text-sm">{label}</span>
        </Button>
      ))}
    </div>
  );
};

export default GenerateButtons;
