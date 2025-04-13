
import { JiraCredentials, JiraProject, JiraTicket } from '@/types/jira';
import { callJiraApi, DEV_MODE } from './apiUtils';

export const fetchJiraTickets = async (
  credentials: JiraCredentials, 
  sprintId: string,
  selectedProject: JiraProject | null
): Promise<JiraTicket[]> => {
  try {
    if (!selectedProject) {
      throw new Error('No project selected');
    }
    
    console.log(`Fetching tickets for sprint ID: ${sprintId} in project ${selectedProject.key} (${selectedProject.id})`);
    
    // Even if DEV_MODE is true, we skip the test data creation
    // and always attempt to fetch real data
    
    // Regular API call for all sprints
    console.log(`Fetching tickets for sprint ID: ${sprintId} in project ${selectedProject.key}`);
    const jqlQuery = `sprint = ${sprintId} ORDER BY updated DESC`;
    const data = await callJiraApi(credentials, `search?jql=${encodeURIComponent(jqlQuery)}&maxResults=50`);
    
    // Ensure data.issues is always an array to prevent the map error
    if (!data.issues) {
      console.log('No issues found in sprint, returning empty issues array');
      return [];
    }
    
    // Transform the response into our JiraTicket format
    return data.issues.map((issue: any) => {
      const fields = issue.fields || {};
      
      return {
        id: issue.id,
        key: issue.key,
        summary: fields.summary || '',
        description: fields.description || '',
        acceptance_criteria: fields.customfield_10016 || '',
        status: fields.status?.name || '',
        assignee: fields.assignee?.displayName || '',
        priority: fields.priority?.name || '',
        story_points: fields.customfield_10026 || 0,
        labels: fields.labels || [],
        epic: fields.epic?.name || '',
        created_at: fields.created,
        updated_at: fields.updated,
        domain: credentials.domain,
        projectId: selectedProject.id,
        sprintId,
        issuetype: fields.issuetype ? {
          id: fields.issuetype.id,
          name: fields.issuetype.name
        } : undefined
      };
    });
  } catch (error) {
    console.error('Error fetching Jira tickets:', error);
    throw error;
  }
};
