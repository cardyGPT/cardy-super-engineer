
import { JiraGenerationResponse } from '@/types/jira';
import { ContentType } from '../ContentDisplay';

export const getContentByType = (content: JiraGenerationResponse | null, type: ContentType): string | null => {
  if (!content) return null;
  
  switch (type) {
    case 'lld':
      return content.lldContent || content.lld || null;
    case 'code':
      return content.codeContent || content.code || null;
    case 'tests':
      return content.testContent || content.tests || null;
    case 'testcases':
      return content.testCasesContent || null;
    case 'testScripts':
      return content.testScriptsContent || null;
    default:
      return null;
  }
};

// Define step sequence for the generation process
export const GENERATION_STEPS = [
  { id: 'select', title: 'Select Story', subtitle: 'Choose a ticket' },
  { id: 'lld', title: 'LLD', subtitle: 'Low-Level Design' },
  { id: 'code', title: 'Code', subtitle: 'Implementation' },
  { id: 'tests', title: 'Unit Tests', subtitle: 'Jest/Jasmine' },
  { id: 'testcases', title: 'Test Cases', subtitle: 'Manual tests' },
  { id: 'testScripts', title: 'Test Scripts', subtitle: 'Playwright/JMeter' }
];

export const getNextStepId = (currentStepId: string): string | null => {
  const currentIndex = GENERATION_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex < 0 || currentIndex >= GENERATION_STEPS.length - 1) return null;
  return GENERATION_STEPS[currentIndex + 1].id;
};

export const getPreviousStepId = (currentStepId: string): string | null => {
  const currentIndex = GENERATION_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex <= 0) return null;
  return GENERATION_STEPS[currentIndex - 1].id;
};

export const isStepCompleted = (
  generatedContent: JiraGenerationResponse | null,
  step: string
): boolean => {
  if (!generatedContent) return false;
  
  switch (step) {
    case 'lld':
      return !!getContentByType(generatedContent, 'lld');
    case 'code':
      return !!getContentByType(generatedContent, 'code');
    case 'tests':
      return !!getContentByType(generatedContent, 'tests');
    case 'testcases':
      return !!getContentByType(generatedContent, 'testcases');
    case 'testScripts':
      return !!getContentByType(generatedContent, 'testScripts');
    default:
      return false;
  }
};

// Get status message based on the content type being generated
export const getStatusMessage = (type: ContentType): string => {
  switch (type) {
    case 'lld':
      return '🛠️ Low-Level Design in progress...\nWe\'re generating the LLD based on your story, project context, and existing artifacts. This will guide the next steps in your development flow.';
    case 'code':
      return '💻 Code is being generated...\nWe\'re translating your LLD into clean, production-ready code. All best practices and relevant patterns from the project context are being applied.';
    case 'tests':
      return '🧪 Generating unit tests...\nCreating Jest (backend) and Jasmine (frontend) tests to validate your code functionality at the component level.';
    case 'testcases':
      return '📋 Creating test cases...\nWe\'re creating comprehensive manual test cases that align with your code and business logic. These help ensure every scenario is accounted for.';
    case 'testScripts':
      return '🎭 Building test scripts...\nGenerating automated functional tests with Playwright and performance tests with JMeter to ensure complete test coverage.';
    default:
      return 'Generating content...';
  }
};
