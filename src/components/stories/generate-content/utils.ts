
import { JiraGenerationResponse } from '@/types/jira';
import { ContentType } from '../ContentDisplay';

export const getContentByType = (content: JiraGenerationResponse | null, type: ContentType): string => {
  if (!content) return '';
  
  switch (type) {
    case 'lld':
      return content.lldContent || content.lld || '';
    case 'code':
      return content.codeContent || content.code || '';
    case 'tests':
      return content.testContent || content.tests || '';
    case 'testcases':
      return content.testCasesContent || '';
    case 'testScripts':
      return content.testScriptsContent || '';
    default:
      return '';
  }
};

export const getStatusMessage = (type: ContentType, isGenerating: boolean): string => {
  if (isGenerating) {
    return `Generating ${type.toUpperCase()}...`;
  }
  return `Generate ${type.toUpperCase()}`;
};

export const hasContentOfType = (content: JiraGenerationResponse | null, type: ContentType): boolean => {
  return Boolean(getContentByType(content, type));
};

// Generation steps configuration
export const GENERATION_STEPS = [
  {
    id: 'select',
    title: 'Select Ticket',
    subtitle: 'Choose a Jira ticket'
  },
  {
    id: 'lld',
    title: 'LLD',
    subtitle: 'Low Level Design'
  },
  {
    id: 'code',
    title: 'Code',
    subtitle: 'Implementation'
  },
  {
    id: 'tests',
    title: 'Tests',
    subtitle: 'Unit Tests'
  },
  {
    id: 'testcases',
    title: 'Test Cases',
    subtitle: 'Test Scenarios'
  },
  {
    id: 'testScripts',
    title: 'Test Scripts',
    subtitle: 'Automation Scripts'
  }
];

export const getNextStepId = (currentStepId: string): string | null => {
  const currentIndex = GENERATION_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === GENERATION_STEPS.length - 1) {
    return null;
  }
  return GENERATION_STEPS[currentIndex + 1].id;
};

export const getPreviousStepId = (currentStepId: string): string | null => {
  const currentIndex = GENERATION_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return GENERATION_STEPS[currentIndex - 1].id;
};

export const isStepCompleted = (content: JiraGenerationResponse | null, stepId: string): boolean => {
  if (!content) return false;
  
  switch (stepId) {
    case 'lld':
      return Boolean(content.lldContent);
    case 'code':
      return Boolean(content.codeContent);
    case 'tests':
      return Boolean(content.testContent);
    case 'testcases':
      return Boolean(content.testCasesContent);
    case 'testScripts':
      return Boolean(content.testScriptsContent);
    default:
      return false;
  }
};
