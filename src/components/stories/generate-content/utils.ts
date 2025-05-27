
import { JiraGenerationResponse } from '@/types/jira';

export const getContentByType = (content: JiraGenerationResponse | null, type: 'lld'): string => {
  if (!content) return '';
  
  switch (type) {
    case 'lld':
      return content.lldContent || content.lld || '';
    default:
      return '';
  }
};

export const hasContentOfType = (content: JiraGenerationResponse | null, type: 'lld'): boolean => {
  return Boolean(getContentByType(content, type));
};
