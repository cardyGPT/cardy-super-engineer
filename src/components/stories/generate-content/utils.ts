
import { JiraGenerationResponse, ContentType } from '@/types/jira';

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

export const hasContentOfType = (content: JiraGenerationResponse | null, type: ContentType): boolean => {
  return Boolean(getContentByType(content, type));
};
