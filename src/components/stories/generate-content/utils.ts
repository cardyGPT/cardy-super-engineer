
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
    default:
      return null;
  }
};
