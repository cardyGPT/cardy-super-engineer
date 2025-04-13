
import { JiraCredentials, JiraSprint } from '@/types/jira';
import { callJiraApi, DEV_MODE } from './apiUtils';

export const fetchJiraSprints = async (credentials: JiraCredentials, projectId: string): Promise<JiraSprint[]> => {
  try {
    console.log(`Fetching Jira sprints for project ID: ${projectId}`);

    // First, try the newer Jira Software REST API endpoint
    try {
      const data = await callJiraApi(credentials, `jira-software-rest/latest/sprints?projectId=${projectId}`);
      if (data && Array.isArray(data.values)) {
        console.log(`Found ${data.values.length} sprints using jira-software-rest API`);
        return data.values.map((sprint: any) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          boardId: sprint.originBoardId,
          projectId
        }));
      }
    } catch (error) {
      console.log('First sprint fetch method failed, trying alternative approach');
    }

    // Next, try the Agile API which might be available in some Jira instances
    try {
      // First get the board for this project
      const boardData = await callJiraApi(credentials, `agile/1.0/board?projectKeyOrId=${projectId}`);
      
      if (boardData?.values?.length > 0) {
        // Then get the sprints for the first board
        const boardId = boardData.values[0].id;
        const sprintsData = await callJiraApi(credentials, `agile/1.0/sprint/search?projectId=${projectId}`);
        
        if (sprintsData && Array.isArray(sprintsData.values)) {
          console.log(`Found ${sprintsData.values.length} sprints using agile API`);
          return sprintsData.values.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: sprint.state,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            boardId,
            projectId
          }));
        }
      }
    } catch (error) {
      console.log('Second sprint fetch method failed, trying last approach');
    }

    // If the above methods fail, as a last resort, check if there are any issues in a sprint
    try {
      // Make a search query to see if any issues have sprint fields
      const searchData = await callJiraApi(credentials, `search?jql=project = ${projectId}&maxResults=1`);
      
      if (searchData?.issues?.length > 0) {
        const issue = searchData.issues[0];
        
        // Check if the issue has sprint fields
        if (issue.fields && issue.fields.sprint) {
          const sprint = issue.fields.sprint;
          console.log('Found sprint information from issues search');
          return [{
            id: sprint.id,
            name: sprint.name,
            state: sprint.state,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            boardId: sprint.originBoardId,
            projectId
          }];
        }
      }
    } catch (error) {
      console.log('All sprint fetch methods failed, falling back to test data');
    }

    // If all methods fail and DEV_MODE is enabled, return test data
    if (DEV_MODE) {
      console.log('[DEV MODE] Returning test sprints');
      return [
        {
          id: `test-${projectId}-active`,
          name: 'Current Sprint (Test)',
          state: 'active',
          boardId: 'test-board',
          projectId
        },
        {
          id: `test-${projectId}-closed`,
          name: 'Previous Sprint (Test)',
          state: 'closed',
          boardId: 'test-board',
          projectId
        }
      ];
    }
    
    // If all else fails and DEV_MODE is disabled, return an empty array
    return [];
  } catch (error) {
    console.error('Error fetching Jira sprints:', error);
    
    // Return test data in dev mode if there's an error
    if (DEV_MODE) {
      console.log('[DEV MODE] Returning test sprints due to error');
      return [
        {
          id: `test-${projectId}-active`,
          name: 'Current Sprint (Test)',
          state: 'active',
          boardId: 'test-board',
          projectId
        }
      ];
    }
    
    throw error;
  }
};
