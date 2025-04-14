
import { JiraGenerationResponse } from '@/types/jira';
import { ContentType } from '../ContentDisplay';

export const getContentByType = (generatedContent: JiraGenerationResponse | null, type: ContentType): string => {
  if (!generatedContent) return '';
  
  switch (type) {
    case 'lld':
      return generatedContent.lldContent || generatedContent.lld || '';
    case 'code':
      return generatedContent.codeContent || generatedContent.code || '';
    case 'tests':
      return generatedContent.testContent || generatedContent.tests || '';
    case 'testcases':
      return generatedContent.testCasesContent || '';
    default:
      return '';
  }
};
