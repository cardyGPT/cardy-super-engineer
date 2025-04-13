
import { JiraCredentials, JiraSprint } from '@/types/jira';
import { callJiraApi, DEV_MODE } from './apiUtils';

export const fetchJiraSprints = async (credentials: JiraCredentials, projectId: string): Promise<JiraSprint[]> => {
  try {
    console.log(`Fetching Jira sprints for project ID: ${projectId}`);

    // Try multiple Jira API endpoints to find sprints
    let sprints: JiraSprint[] = [];
    
    // First, try the Agile API with board search
    try {
      // Get boards for this project
      const boardsData = await callJiraApi(credentials, `agile/1.0/board?projectKeyOrId=${projectId}`);
      
      if (boardsData?.values?.length > 0) {
        console.log(`Found ${boardsData.values.length} boards for project ${projectId}`);
        
        // For each board, try to get sprints
        for (const board of boardsData.values.slice(0, 3)) { // Limit to first 3 boards to avoid too many requests
          try {
            console.log(`Fetching sprints for board ID: ${board.id}`);
            const sprintsData = await callJiraApi(credentials, `agile/1.0/board/${board.id}/sprint?state=active,future,closed`);
            
            if (sprintsData?.values?.length > 0) {
              console.log(`Found ${sprintsData.values.length} sprints on board ${board.id}`);
              const boardSprints = sprintsData.values.map((sprint: any) => ({
                id: sprint.id,
                name: sprint.name,
                state: sprint.state,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                boardId: board.id,
                projectId
              }));
              
              sprints = [...sprints, ...boardSprints];
            }
          } catch (err) {
            console.log(`Error fetching sprints for board ${board.id}:`, err);
            // Continue to next board
          }
        }
      }
    } catch (boardError) {
      console.log('Board search method failed:', boardError);
    }
    
    // If we found sprints via board API, return them
    if (sprints.length > 0) {
      console.log(`Returning ${sprints.length} sprints found via board API`);
      return sprints;
    }
    
    // Second, try the Jira Software REST API endpoint (newer Jira instances)
    try {
      const data = await callJiraApi(credentials, `jira-software-rest/latest/sprints?projectId=${projectId}`);
      if (data && Array.isArray(data.values) && data.values.length > 0) {
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
      console.log('Jira Software REST API method failed:', error);
    }

    // Third method: direct sprint search endpoint
    try {
      const sprintsData = await callJiraApi(credentials, `agile/1.0/sprint/search?projectId=${projectId}`);
      
      if (sprintsData && Array.isArray(sprintsData.values) && sprintsData.values.length > 0) {
        console.log(`Found ${sprintsData.values.length} sprints using sprint search API`);
        return sprintsData.values.map((sprint: any) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          boardId: sprint.originBoardId || 'unknown',
          projectId
        }));
      }
    } catch (error) {
      console.log('Sprint search API method failed:', error);
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
