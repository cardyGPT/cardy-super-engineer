import { JiraCredentials, JiraSprint } from '@/types/jira';
import { callJiraApi, DEV_MODE } from './apiUtils';

export const fetchJiraSprints = async (
  credentials: JiraCredentials, 
  projectId: string,
  apiType: 'agile' | 'classic' | 'cloud' = 'agile'
): Promise<JiraSprint[]> => {
  try {
    console.log(`Fetching Jira sprints for project ID: ${projectId} using ${apiType} API`);

    // For classic Jira, we'll use a simpler approach with direct project API
    if (apiType === 'classic') {
      return await fetchClassicJiraSprints(credentials, projectId);
    }
    
    // For Cloud Jira, use the same API as Agile but with potential different handling
    if (apiType === 'cloud') {
      return await fetchCloudJiraSprints(credentials, projectId);
    }
    
    // For Agile Jira, we'll use the standard Agile API
    const agileResult = await fetchAgileJiraSprints(credentials, projectId);
    
    // If we get an empty array from the Agile API, try classic as fallback
    if (agileResult.length === 0) {
      console.log('No sprints found with Agile API, trying classic API as fallback');
      return await fetchClassicJiraSprints(credentials, projectId);
    }
    
    return agileResult;
  } catch (error) {
    console.error('Error fetching Jira sprints:', error);
    
    // If agile API fails, try classic as fallback
    try {
      console.log('Agile API failed, trying classic API as fallback');
      return await fetchClassicJiraSprints(credentials, projectId);
    } catch (fallbackError) {
      // If both fail, throw the original error
      throw error;
    }
  }
};

// Fetch sprints using Cloud API (similar to Agile but with specific cloud features)
const fetchCloudJiraSprints = async (
  credentials: JiraCredentials,
  projectId: string
): Promise<JiraSprint[]> => {
  try {
    // For now, the Cloud API implementation is the same as Agile
    // In the future, we can customize this for specific Cloud API features
    console.log(`Fetching boards for project ID: ${projectId} using Cloud API`);
    const boardsData = await callJiraApi(
      credentials, 
      `agile/1.0/board?projectKeyOrId=${projectId}`
    );
    
    if (!boardsData?.values || boardsData.values.length === 0) {
      console.log(`No boards found for project ${projectId}`);
      return [];
    }
    
    console.log(`Found ${boardsData.values.length} boards for project ${projectId}`);
    
    // Get the first scrum or kanban board (limit to first 3 boards)
    const boards = boardsData.values.slice(0, 3);
    let allSprints: JiraSprint[] = [];
    
    // For each board, get the sprints
    for (const board of boards) {
      try {
        console.log(`Fetching sprints for board ID: ${board.id}`);
        const sprintsData = await callJiraApi(
          credentials, 
          `agile/1.0/board/${board.id}/sprint?state=active,future,closed`
        );
        
        if (sprintsData?.values && sprintsData.values.length > 0) {
          console.log(`Found ${sprintsData.values.length} sprints for board ${board.id}`);
          
          const boardSprints = sprintsData.values.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: (sprint.state || '').toLowerCase(),
            startDate: sprint.startDate || null,
            endDate: sprint.endDate || null,
            boardId: board.id,
            projectId
          }));
          
          allSprints = [...allSprints, ...boardSprints];
        }
      } catch (err) {
        console.log(`Error fetching sprints for board ${board.id}:`, err);
        // Continue to next board
      }
    }
    
    // Sort sprints: active first, then future, then closed
    return allSprints.sort((a, b) => {
      const stateOrder: Record<string, number> = { 'active': 0, 'future': 1, 'closed': 2 };
      const stateA = (a.state || '').toLowerCase();
      const stateB = (b.state || '').toLowerCase();
      return (stateOrder[stateA] || 3) - (stateOrder[stateB] || 3);
    });
  } catch (error) {
    console.error('Error fetching Cloud Jira sprints:', error);
    throw error;
  }
};

// Fetch sprints using Agile API
const fetchAgileJiraSprints = async (
  credentials: JiraCredentials,
  projectId: string
): Promise<JiraSprint[]> => {
  try {
    // First, get the boards for this project
    console.log(`Fetching boards for project ID: ${projectId} using Agile API`);
    const boardsData = await callJiraApi(
      credentials, 
      `agile/1.0/board?projectKeyOrId=${projectId}`
    );
    
    if (!boardsData?.values || boardsData.values.length === 0) {
      console.log(`No boards found for project ${projectId}`);
      return [];
    }
    
    console.log(`Found ${boardsData.values.length} boards for project ${projectId}`);
    
    // Get the first scrum or kanban board (limit to first 3 boards)
    const boards = boardsData.values.slice(0, 3);
    let allSprints: JiraSprint[] = [];
    
    // For each board, get the sprints
    for (const board of boards) {
      try {
        console.log(`Fetching sprints for board ID: ${board.id}`);
        const sprintsData = await callJiraApi(
          credentials, 
          `agile/1.0/board/${board.id}/sprint?state=active,future,closed`
        );
        
        if (sprintsData?.values && sprintsData.values.length > 0) {
          console.log(`Found ${sprintsData.values.length} sprints for board ${board.id}`);
          
          const boardSprints = sprintsData.values.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: (sprint.state || '').toLowerCase(),
            startDate: sprint.startDate || null,
            endDate: sprint.endDate || null,
            boardId: board.id,
            projectId
          }));
          
          allSprints = [...allSprints, ...boardSprints];
        }
      } catch (err) {
        console.log(`Error fetching sprints for board ${board.id}:`, err);
        // Continue to next board
      }
    }
    
    // Sort sprints: active first, then future, then closed
    return allSprints.sort((a, b) => {
      const stateOrder: Record<string, number> = { 'active': 0, 'future': 1, 'closed': 2 };
      const stateA = (a.state || '').toLowerCase();
      const stateB = (b.state || '').toLowerCase();
      return (stateOrder[stateA] || 3) - (stateOrder[stateB] || 3);
    });
  } catch (error) {
    console.error('Error fetching Agile Jira sprints:', error);
    throw error;
  }
};

// Fetch "sprints" using Classic API (fake sprints from project versions)
const fetchClassicJiraSprints = async (
  credentials: JiraCredentials,
  projectId: string
): Promise<JiraSprint[]> => {
  try {
    console.log(`Fetching project versions for classic Jira project ID: ${projectId}`);
    
    // For Classic Jira, we'll use project versions as "sprints"
    const versionsData = await callJiraApi(
      credentials, 
      `project/${projectId}/versions`
    );
    
    if (!Array.isArray(versionsData) || versionsData.length === 0) {
      console.log(`No versions found for classic Jira project ${projectId}`);
      
      // If no versions, create a dummy "All Issues" sprint
      return [{
        id: `classic-${projectId}`,
        name: 'All Issues',
        state: 'active',
        startDate: null,
        endDate: null,
        boardId: 'classic',
        projectId
      }];
    }
    
    console.log(`Found ${versionsData.length} versions for classic Jira project ${projectId}`);
    
    // Map versions to sprints
    const sprints = versionsData.map((version: any) => ({
      id: `version-${version.id}`,
      name: version.name,
      state: version.released ? 'closed' : 'active',
      startDate: null,
      endDate: version.releaseDate || null,
      boardId: 'classic',
      projectId
    }));
    
    // Always add an "All Issues" option for classic Jira
    sprints.unshift({
      id: `classic-${projectId}`,
      name: 'All Issues',
      state: 'active',
      startDate: null,
      endDate: null,
      boardId: 'classic',
      projectId
    });
    
    return sprints;
  } catch (error) {
    console.error('Error fetching Classic Jira sprints:', error);
    
    // Return a dummy "All Issues" sprint as fallback
    return [{
      id: `classic-${projectId}`,
      name: 'All Issues',
      state: 'active',
      startDate: null,
      endDate: null,
      boardId: 'classic',
      projectId
    }];
  }
};
