
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
    
    // Handle test sprint in dev mode
    if (DEV_MODE && sprintId.startsWith('test-')) {
      console.log(`[DEV MODE] Creating test tickets for test sprint ${sprintId}`);
      const projectId = sprintId.replace('test-', '');
      
      // Verify this test sprint belongs to the selected project
      if (projectId !== selectedProject.id) {
        console.warn(`Test sprint ${sprintId} does not match selected project ${selectedProject.id}`);
        // Create empty ticket array for mismatched project/sprint
        return [];
      }
      
      // Creating mock data for development purposes
      const mockTickets: JiraTicket[] = [
        {
          id: `${projectId}-1001`,
          key: `${selectedProject.key}-1001`,
          summary: 'Implement user authentication flow',
          description: 'Create a secure authentication flow that includes registration, login, and password recovery.',
          status: 'In Progress',
          issuetype: { id: '1', name: 'Story' },
          domain: credentials.domain,
          projectId: selectedProject.id,
          sprintId
        },
        {
          id: `${projectId}-1002`,
          key: `${selectedProject.key}-1002`,
          summary: 'Fix login screen validation issues',
          description: 'Users are reporting that login validation error messages are confusing. Improve the UX.',
          status: 'To Do',
          issuetype: { id: '2', name: 'Bug' },
          domain: credentials.domain,
          projectId: selectedProject.id,
          sprintId
        },
        {
          id: `${projectId}-1003`,
          key: `${selectedProject.key}-1003`,
          summary: 'Add payment integration with Stripe',
          description: 'Integrate Stripe payment gateway to process subscription payments.',
          status: 'To Do',
          issuetype: { id: '1', name: 'Story' },
          domain: credentials.domain,
          projectId: selectedProject.id,
          sprintId
        },
        {
          id: `${projectId}-1004`,
          key: `${selectedProject.key}-1004`,
          summary: 'Update user preferences dashboard',
          description: 'Enhance the user preferences dashboard to include new notification settings.',
          status: 'In Progress',
          issuetype: { id: '3', name: 'Task' },
          domain: credentials.domain,
          projectId: selectedProject.id,
          sprintId
        },
        {
          id: `${projectId}-1005`,
          key: `${selectedProject.key}-1005`,
          summary: 'Performance optimization for report generation',
          description: 'Reports are taking too long to generate. Optimize database queries and caching.',
          status: 'To Do',
          issuetype: { id: '1', name: 'Story' },
          domain: credentials.domain,
          projectId: selectedProject.id,
          sprintId
        }
      ];
      
      return mockTickets;
    }
    
    // Regular API call for real sprints
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
