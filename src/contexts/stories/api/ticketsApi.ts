
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
    
    // Test if this is a development sprint
    if (sprintId.startsWith('test-')) {
      if (DEV_MODE) {
        console.log('[DEV MODE] Returning test tickets for development sprint');
        return [
          {
            id: `test-${sprintId}-1`,
            key: `${selectedProject.key}-101`,
            summary: 'Implement login functionality',
            description: 'Create a secure login system with email/password authentication',
            status: 'In Progress',
            assignee: 'John Doe',
            labels: ['frontend', 'auth'],
            domain: credentials.domain,
            projectId: selectedProject.id,
            sprintId,
            issuetype: {
              id: '10001',
              name: 'Story'
            }
          },
          {
            id: `test-${sprintId}-2`,
            key: `${selectedProject.key}-102`,
            summary: 'Fix layout issues on mobile devices',
            description: 'The dashboard layout is broken on small screens',
            status: 'To Do',
            assignee: 'Jane Smith',
            labels: ['frontend', 'bug', 'mobile'],
            domain: credentials.domain,
            projectId: selectedProject.id,
            sprintId,
            issuetype: {
              id: '10004',
              name: 'Bug'
            }
          },
          {
            id: `test-${sprintId}-3`,
            key: `${selectedProject.key}-103`,
            summary: 'Add user profile page',
            description: 'Create a page where users can view and edit their profile information',
            status: 'To Do',
            assignee: 'John Doe',
            labels: ['frontend', 'user-management'],
            domain: credentials.domain,
            projectId: selectedProject.id,
            sprintId,
            issuetype: {
              id: '10001',
              name: 'Story'
            }
          }
        ];
      }
    }
    
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
    
    // Return test data in dev mode if there's an error
    if (DEV_MODE && selectedProject) {
      console.log('[DEV MODE] Returning test tickets due to error');
      return [
        {
          id: `error-${Date.now()}`,
          key: `${selectedProject.key}-999`,
          summary: '[TEST] Error fetching tickets - this is a test ticket',
          description: 'This is a test ticket that appears when there is an error fetching real tickets',
          status: 'Error',
          domain: credentials.domain,
          projectId: selectedProject.id,
          sprintId,
          issuetype: {
            id: '10001',
            name: 'Story'
          }
        }
      ];
    }
    
    throw error;
  }
};
