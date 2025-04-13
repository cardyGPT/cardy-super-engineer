
import { JiraCredentials, JiraSprint } from '@/types/jira';
import { callJiraApi, DEV_MODE } from './apiUtils';

export const fetchJiraSprints = async (credentials: JiraCredentials, projectId: string): Promise<JiraSprint[]> => {
  try {
    console.log(`Fetching Jira sprints for project ID: ${projectId}`);

    // First, try to get all boards for this project
    let boards = [];
    try {
      const boardsData = await callJiraApi(credentials, `agile/1.0/board?projectKeyOrId=${projectId}`);
      
      if (boardsData?.values?.length > 0) {
        console.log(`Found ${boardsData.values.length} boards for project ${projectId}`);
        boards = boardsData.values.slice(0, 3); // Limit to first 3 boards to avoid too many requests
      } else {
        console.log(`No boards found for project ${projectId}`);
      }
    } catch (boardError) {
      console.error('Error fetching boards:', boardError);
    }

    // Try multiple approaches to find sprints, prioritizing active ones
    let sprints: JiraSprint[] = [];
    let foundActiveSprints = false;
    
    // APPROACH 1: Try each board individually for active sprints first
    if (boards.length > 0) {
      for (const board of boards) {
        try {
          console.log(`Fetching ACTIVE sprints specifically for board ID: ${board.id}`);
          
          const activeSprintsData = await callJiraApi(credentials, `agile/1.0/board/${board.id}/sprint?state=active`);
          
          if (activeSprintsData?.values?.length > 0) {
            console.log(`SUCCESS: Found ${activeSprintsData.values.length} active sprints on board ${board.id}`);
            
            const activeBoardSprints = activeSprintsData.values.map((sprint: any) => ({
              id: sprint.id,
              name: sprint.name,
              state: 'active', // Explicitly mark as active
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              boardId: board.id,
              projectId
            }));
            
            sprints = [...sprints, ...activeBoardSprints];
            foundActiveSprints = true;
          } else {
            console.log(`No active sprints found on board ${board.id}`);
          }
        } catch (err) {
          console.log(`Error fetching active sprints for board ${board.id}:`, err);
          // Continue to next board
        }
      }
      
      // If we found active sprints, we're done
      if (foundActiveSprints) {
        console.log(`Found ${sprints.length} active sprints across all boards. Returning only active sprints.`);
        return sprints;
      }
      
      // APPROACH 2: If no active sprints found, try getting all sprints for each board
      console.log('No active sprints found. Attempting to fetch all sprints (active, future, closed)');
      
      for (const board of boards) {
        try {
          console.log(`Fetching ALL sprints for board ID: ${board.id}`);
          
          const allSprintsData = await callJiraApi(credentials, `agile/1.0/board/${board.id}/sprint?state=active,future,closed`);
          
          if (allSprintsData?.values?.length > 0) {
            console.log(`Found ${allSprintsData.values.length} total sprints on board ${board.id}`);
            
            const boardSprints = allSprintsData.values.map((sprint: any) => ({
              id: sprint.id,
              name: sprint.name,
              state: (sprint.state || '').toLowerCase(), // Normalize state to lowercase
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              boardId: board.id,
              projectId
            }));
            
            sprints = [...sprints, ...boardSprints];
          } else {
            console.log(`No sprints found on board ${board.id}`);
          }
        } catch (err) {
          console.log(`Error fetching all sprints for board ${board.id}:`, err);
          // Continue to next board
        }
      }
    }
    
    // APPROACH 3: If board approach didn't work, try direct sprint search for active sprints
    if (sprints.length === 0) {
      try {
        console.log('Attempting direct sprint search for ACTIVE sprints...');
        
        const activeSprintsData = await callJiraApi(credentials, `agile/1.0/sprint/search?projectId=${projectId}&state=active`);
        
        if (activeSprintsData?.values?.length > 0) {
          console.log(`SUCCESS: Found ${activeSprintsData.values.length} active sprints using direct sprint search`);
          
          const activeSearchSprints = activeSprintsData.values.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: 'active', // Explicitly mark as active
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            boardId: sprint.originBoardId || 'unknown',
            projectId
          }));
          
          sprints = [...sprints, ...activeSearchSprints];
          foundActiveSprints = true;
        } else {
          console.log('No active sprints found via direct sprint search');
        }
      } catch (error) {
        console.error('Sprint search API for active sprints failed:', error);
      }
    }
    
    // APPROACH 4: If no active sprints found at all, try direct search for ALL sprints
    if (sprints.length === 0) {
      try {
        console.log('No sprints found yet. Attempting direct sprint search for ALL sprints...');
        
        const allSprintsData = await callJiraApi(credentials, `agile/1.0/sprint/search?projectId=${projectId}`);
        
        if (allSprintsData?.values?.length > 0) {
          console.log(`Found ${allSprintsData.values.length} sprints using direct sprint search (all states)`);
          
          const allSearchSprints = allSprintsData.values.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: (sprint.state || '').toLowerCase(), // Normalize state to lowercase
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            boardId: sprint.originBoardId || 'unknown',
            projectId
          }));
          
          sprints = [...sprints, ...allSearchSprints];
        } else {
          console.log('No sprints found via direct sprint search for all states');
        }
      } catch (error) {
        console.error('Sprint search API for all sprints failed:', error);
      }
    }
    
    // APPROACH 5: Last resort - try the newer Jira Software REST API
    if (sprints.length === 0) {
      try {
        console.log('Attempting to use Jira Software REST API as last resort...');
        
        // Try active sprints first
        const activeSoftwareData = await callJiraApi(credentials, `jira-software-rest/latest/sprints?projectId=${projectId}&state=active`);
        
        if (activeSoftwareData?.values?.length > 0) {
          console.log(`Found ${activeSoftwareData.values.length} active sprints using Jira Software REST API`);
          
          const activeSoftwareSprints = activeSoftwareData.values.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: 'active', // Explicitly mark as active
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            boardId: sprint.originBoardId || 'unknown',
            projectId
          }));
          
          sprints = [...sprints, ...activeSoftwareSprints];
        } else {
          // If no active sprints, try all states
          const allSoftwareData = await callJiraApi(credentials, `jira-software-rest/latest/sprints?projectId=${projectId}`);
          
          if (allSoftwareData?.values?.length > 0) {
            console.log(`Found ${allSoftwareData.values.length} sprints using Jira Software REST API (all states)`);
            
            const allSoftwareSprints = allSoftwareData.values.map((sprint: any) => ({
              id: sprint.id,
              name: sprint.name,
              state: (sprint.state || '').toLowerCase(), // Normalize state to lowercase
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              boardId: sprint.originBoardId || 'unknown',
              projectId
            }));
            
            sprints = [...sprints, ...allSoftwareSprints];
          }
        }
      } catch (error) {
        console.error('Jira Software REST API failed:', error);
      }
    }
    
    // If we have sprints, return them sorted (active first)
    if (sprints.length > 0) {
      console.log(`Returning ${sprints.length} sprints with states:`, sprints.map(s => s.state));
      
      // Sort sprints: active first, then future, then closed
      const sortedSprints = sprints.sort((a, b) => {
        const stateOrder: Record<string, number> = { 'active': 0, 'future': 1, 'closed': 2 };
        const stateA = (a.state || '').toLowerCase();
        const stateB = (b.state || '').toLowerCase();
        return (stateOrder[stateA] || 3) - (stateOrder[stateB] || 3);
      });
      
      return sortedSprints;
    }
    
    // Fallback to test data in DEV_MODE if nothing was found
    if (DEV_MODE) {
      console.log('[DEV MODE] Returning test sprints since no real sprints were found');
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
