
import { JiraCredentials, JiraSprint } from '@/types/jira';
import { callJiraApi, DEV_MODE } from './apiUtils';

export const fetchJiraSprints = async (credentials: JiraCredentials, projectId: string): Promise<JiraSprint[]> => {
  console.log(`Attempting to fetch sprints for project ID: ${projectId}`);
  
  try {
    // APPROACH 1: Try to fetch active sprints directly using JQL
    console.log(`APPROACH 1: Fetching active sprints directly for project ${projectId} using JQL`);
    const jqlQuery = `project = ${projectId} AND sprint in openSprints()`;
    const activeSprintsData = await callJiraApi(credentials, `search?jql=${encodeURIComponent(jqlQuery)}&maxResults=1`);
    
    if (activeSprintsData.issues && activeSprintsData.issues.length > 0) {
      // Extract sprint info from the first issue
      const issue = activeSprintsData.issues[0];
      const sprints = issue.fields?.sprint || [];
      if (Array.isArray(sprints) && sprints.length > 0) {
        console.log(`Found ${sprints.length} active sprints via JQL approach`);
        return sprints.map((sprint: any) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          boardId: sprint.originBoardId || '0',
          projectId
        }));
      }
    }
    
    // APPROACH 2: If no active sprints found with JQL, try getting boards for the project
    console.log(`APPROACH 2: Fetching boards for project ${projectId}`);
    const boardsData = await callJiraApi(credentials, `agile/1.0/board?projectKeyOrId=${projectId}`);
    
    if (boardsData.values && boardsData.values.length > 0) {
      console.log(`Found ${boardsData.values.length} boards for project ${projectId}`);
      
      // For each board, try to fetch active sprints
      for (const board of boardsData.values) {
        try {
          console.log(`Fetching sprints for board ${board.id}`);
          const sprintsData = await callJiraApi(credentials, `agile/1.0/board/${board.id}/sprint?state=active,future`);
          
          if (sprintsData.values && sprintsData.values.length > 0) {
            console.log(`Found ${sprintsData.values.length} sprints for board ${board.id}`);
            return sprintsData.values.map((sprint: any) => ({
              id: sprint.id,
              name: sprint.name,
              state: sprint.state,
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              boardId: board.id,
              projectId
            }));
          } else {
            console.log(`No active/future sprints found for board ${board.id}`);
          }
        } catch (err) {
          console.error(`Error fetching sprints for board ${board.id}:`, err);
          // Continue to next board if this one fails
        }
      }
    } else {
      console.log(`No boards found for project ${projectId}`);
    }
    
    // APPROACH 3: Try another JQL query variation
    console.log(`APPROACH 3: Trying alternative JQL query for sprints in project ${projectId}`);
    const alternativeJql = `project = ${projectId} AND sprint not in closedSprints()`;
    const altSprintsData = await callJiraApi(credentials, `search?jql=${encodeURIComponent(alternativeJql)}&maxResults=1`);
    
    if (altSprintsData.issues && altSprintsData.issues.length > 0) {
      const issue = altSprintsData.issues[0];
      const sprints = issue.fields?.sprint || [];
      if (Array.isArray(sprints) && sprints.length > 0) {
        console.log(`Found ${sprints.length} active sprints via alternative JQL approach`);
        return sprints.map((sprint: any) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state || 'active',
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          boardId: sprint.originBoardId || '0',
          projectId
        }));
      }
    }
    
    // APPROACH 4: Last resort - get all sprints across all boards
    console.log(`APPROACH 4: Trying to fetch all sprints across all boards`);
    const allBoardsData = await callJiraApi(credentials, `agile/1.0/board`);
    
    if (allBoardsData.values && allBoardsData.values.length > 0) {
      console.log(`Found ${allBoardsData.values.length} boards total, checking for project ${projectId} sprints`);
      
      for (const board of allBoardsData.values.slice(0, 5)) { // Limit to first 5 boards to avoid too many requests
        try {
          console.log(`Checking board ${board.id} for sprints related to project ${projectId}`);
          const sprintsData = await callJiraApi(credentials, `agile/1.0/board/${board.id}/sprint?state=active`);
          
          if (sprintsData.values && sprintsData.values.length > 0) {
            // For each sprint, check if it contains issues from our project
            for (const sprint of sprintsData.values) {
              try {
                const sprintIssuesJql = `project = ${projectId} AND sprint = ${sprint.id}`;
                const sprintIssuesData = await callJiraApi(credentials, `search?jql=${encodeURIComponent(sprintIssuesJql)}&maxResults=1`);
                
                if (sprintIssuesData.issues && sprintIssuesData.issues.length > 0) {
                  // This sprint contains issues from our project, so return it
                  console.log(`Found sprint ${sprint.id} with issues for project ${projectId}`);
                  return [{
                    id: sprint.id,
                    name: sprint.name,
                    state: sprint.state,
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                    boardId: board.id,
                    projectId
                  }];
                }
              } catch (err) {
                console.error(`Error checking sprint ${sprint.id} for project ${projectId}:`, err);
                // Continue to next sprint
              }
            }
          }
        } catch (err) {
          // Ignore errors for individual boards
          continue;
        }
      }
    }
    
    console.log(`No active or future sprints found for project ${projectId} after trying all approaches`);
    
    // If we're in dev mode and no sprints were found, create a test sprint
    if (DEV_MODE) {
      console.log(`[DEV MODE] Creating a test sprint for project ${projectId} for development purposes`);
      const testSprint: JiraSprint = {
        id: `test-${projectId}`,
        name: `Development Sprint for ${projectId} (Test) (active)`,
        state: 'active',
        boardId: '0',
        projectId // Add projectId to the sprint to track which project it belongs to
      };
      return [testSprint];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Jira sprints:', error);
    throw error;
  }
};
