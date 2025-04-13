
import { JiraCredentials, JiraProject } from '@/types/jira';
import { callJiraApi } from './apiUtils';

export const fetchJiraProjects = async (credentials: JiraCredentials): Promise<JiraProject[]> => {
  try {
    console.log('Fetching Jira projects with credentials...', {
      domain: credentials.domain,
      email: credentials.email,
      apiToken: credentials.apiToken ? '[REDACTED]' : 'missing'
    });
    
    const data = await callJiraApi(credentials, 'project');
    console.log('Jira projects API response:', data);
    
    if (!data || !Array.isArray(data)) {
      console.error('Invalid response format from Jira API:', data);
      throw new Error('Invalid response format from Jira API');
    }
    
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
