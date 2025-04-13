
import { JiraCredentials, JiraSprint } from '@/types/jira';
import { callJiraApi, DEV_MODE } from './apiUtils';

export const fetchJiraSprints = async (credentials: JiraCredentials, projectId: string): Promise<JiraSprint[]> => {
  console.log(`Attempting to fetch sprints for project ID: ${projectId}`);
  
  try {
    // APPROACH 1: Try to fetch all sprints (including closed ones) using JQL
    console.log(`APPROACH 1: Fetching all sprints for project ${projectId} using JQL`);
    const jqlQuery = `project = ${projectId}`;
    
    try {
      const allSprintsData = await callJiraApi(credentials, `search?jql=${encodeURIComponent(jqlQuery)}&maxResults=1`);
      
      if (allSprintsData?.issues && allSprintsData.issues.length > 0) {
        // Extract sprint info from the first issue
        const issue = allSprintsData.issues[0];
        const sprints = issue.fields?.closedSprints || [];
        const activeSprints = issue.fields?.sprint ? [issue.fields.sprint] : [];
        
        // Combine active and closed sprints
        const allSprints = [...activeSprints, ...sprints];
        
        if (Array.isArray(allSprints) && allSprints.length > 0) {
          console.log(`Found ${allSprints.length} sprints via JQL approach`);
          return allSprints.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: sprint.state,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            boardId: sprint.originBoardId || '0',
            projectId
          }));
        } else {
          console.log('No sprints found in first issue via JQL approach');
        }
      }
    } catch (jqlError) {
      console.error('Error in JQL approach:', jqlError);
      // Continue to next approach
    }
    
    // APPROACH 2: Fetch all boards for the project and then get sprints for each board
    try {
      console.log(`APPROACH 2: Fetching boards for project ${projectId}`);
      
      // Fetch boards for the project - handle this API call carefully as it might fail
      let boardsData;
      try {
        boardsData = await callJiraApi(credentials, `agile/1.0/board?projectKeyOrId=${projectId}`);
      } catch (boardsError) {
        console.error('Error fetching boards:', boardsError);
        // If this fails, we'll try a different approach or use development data
        boardsData = { values: [] };
      }
      
      if (boardsData?.values && boardsData.values.length > 0) {
        console.log(`Found ${boardsData.values.length} boards for project ${projectId}`);
        
        // For each board, try to fetch sprints
        for (const board of boardsData.values) {
          try {
            console.log(`Fetching sprints for board ${board.id}`);
            const sprintsData = await callJiraApi(credentials, `agile/1.0/board/${board.id}/sprint?state=active,future,closed`);
            
            if (sprintsData?.values && sprintsData.values.length > 0) {
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
              console.log(`No sprints found for board ${board.id}`);
            }
          } catch (boardError) {
            console.error(`Error fetching sprints for board ${board.id}:`, boardError);
            // Continue to next board
          }
        }
      } else {
        console.log(`No boards found for project ${projectId}`);
      }
    } catch (boardsError) {
      console.error('Error in boards approach:', boardsError);
      // Continue to fallback approach
    }
    
    // APPROACH 3: Direct JQL query for sprints
    try {
      console.log(`APPROACH 3: Direct JQL query for sprints for project ${projectId}`);
      const jqlQueryForSprints = `project = ${projectId} ORDER BY created DESC`;
      
      const sprintQueryData = await callJiraApi(credentials, `search?jql=${encodeURIComponent(jqlQueryForSprints)}&maxResults=50`);
      
      if (sprintQueryData?.issues && sprintQueryData.issues.length > 0) {
        // Collect all unique sprints from all issues
        const sprintMap = new Map();
        
        for (const issue of sprintQueryData.issues) {
          // Check for active sprint
          if (issue.fields?.sprint) {
            const sprint = issue.fields.sprint;
            sprintMap.set(sprint.id, {
              id: sprint.id,
              name: sprint.name,
              state: sprint.state,
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              boardId: sprint.originBoardId || '0',
              projectId
            });
          }
          
          // Check for closed sprints
          if (issue.fields?.closedSprints && Array.isArray(issue.fields.closedSprints)) {
            for (const sprint of issue.fields.closedSprints) {
              sprintMap.set(sprint.id, {
                id: sprint.id,
                name: sprint.name,
                state: sprint.state,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                boardId: sprint.originBoardId || '0',
                projectId
              });
            }
          }
        }
        
        const uniqueSprints = Array.from(sprintMap.values());
        if (uniqueSprints.length > 0) {
          console.log(`Found ${uniqueSprints.length} sprints via direct JQL approach`);
          return uniqueSprints;
        }
      }
    } catch (directJqlError) {
      console.error('Error in direct JQL approach:', directJqlError);
      // Continue to development mode or return empty array
    }
    
    // If we're in dev mode and no sprints were found, create a test sprint
    if (DEV_MODE) {
      console.log(`[DEV MODE] Creating test sprints for project ${projectId} for development purposes`);
      const testSprints: JiraSprint[] = [
        {
          id: `test-${projectId}-1`,
          name: `Current Sprint for ${projectId} (Test)`,
          state: 'active',
          boardId: '0',
          projectId
        },
        {
          id: `test-${projectId}-2`,
          name: `Backlog Sprint for ${projectId} (Test)`,
          state: 'future',
          boardId: '0',
          projectId
        }
      ];
      return testSprints;
    }
    
    // If all approaches failed and we're not in dev mode
    console.log(`No sprints found for project ${projectId} after trying all approaches`);
    return [];
  } catch (error) {
    console.error('Error fetching Jira sprints:', error);
    
    // Even if there's an error, return test data in dev mode
    if (DEV_MODE) {
      console.log(`[DEV MODE] Returning test sprints due to error`);
      return [
        {
          id: `test-${projectId}-error`,
          name: `Fallback Sprint for ${projectId} (Test)`,
          state: 'active',
          boardId: '0',
          projectId
        }
      ];
    }
    
    throw error;
  }
};
