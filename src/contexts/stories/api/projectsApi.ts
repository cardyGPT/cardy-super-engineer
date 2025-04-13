
import { JiraCredentials, JiraProject } from '@/types/jira';
import { callJiraApi } from './apiUtils';

export const fetchJiraProjects = async (credentials: JiraCredentials): Promise<JiraProject[]> => {
  try {
    console.log('Fetching Jira projects...');
    const data = await callJiraApi(credentials, 'project');
    
    // Transform the response into our JiraProject format
    return data.map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      avatarUrl: project.avatarUrls?.['48x48'],
      domain: credentials.domain
    }));
  } catch (error) {
    console.error('Error fetching Jira projects:', error);
    throw error;
  }
};
