
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
      
      if (allSprintsData.issues && allSprintsData.issues.length > 0) {
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
        }
      }
    } catch (jqlError) {
      console.error('Error in JQL approach:', jqlError);
      // Continue to next approach
    }
    
    // APPROACH 2: If no sprints found with JQL, try getting boards for the project
    console.log(`APPROACH 2: Fetching boards for project ${projectId}`);
    
    try {
      const boardsData = await callJiraApi(credentials, `agile/1.0/board?projectKeyOrId=${projectId}`);
      
      if (boardsData.values && boardsData.values.length > 0) {
        console.log(`Found ${boardsData.values.length} boards for project ${projectId}`);
        
        // For each board, try to fetch all sprints (including closed ones)
        for (const board of boardsData.values) {
          try {
            console.log(`Fetching all sprints for board ${board.id}`);
            const sprintsData = await callJiraApi(credentials, `agile/1.0/board/${board.id}/sprint?state=active,future,closed`);
            
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
              console.log(`No sprints found for board ${board.id}`);
            }
          } catch (boardError) {
            console.error(`Error fetching sprints for board ${board.id}:`, boardError);
            // Continue to next board if this one fails
          }
        }
      } else {
        console.log(`No boards found for project ${projectId}`);
      }
    } catch (boardsError) {
      console.error('Error fetching boards:', boardsError);
      // Continue to next approach
    }
    
    // If we're in dev mode and no sprints were found, create a test sprint
    if (DEV_MODE) {
      console.log(`[DEV MODE] Creating a test sprint for project ${projectId} for development purposes`);
      const testSprint: JiraSprint = {
        id: `test-${projectId}`,
        name: `Development Sprint for ${projectId} (Test)`,
        state: 'active',
        boardId: '0',
        projectId
      };
      return [testSprint];
    }
    
    // If all approaches failed and we're not in dev mode
    console.log(`No sprints found for project ${projectId} after trying all approaches`);
    return [];
  } catch (error) {
    console.error('Error fetching Jira sprints:', error);
    throw error;
  }
};
