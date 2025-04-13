
import { supabase } from '@/lib/supabase';
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';

export const fetchJiraProjects = async (credentials: JiraCredentials): Promise<JiraProject[]> => {
  const { domain, email, apiToken } = credentials;

  if (!domain || !email || !apiToken) {
    throw new Error('Missing Jira credentials. Please check your settings.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        path: 'project'
      }
    });

    if (error) {
      console.error('Error fetching Jira projects:', error);
      throw new Error(`Failed to fetch Jira projects: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from Jira API');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (!Array.isArray(data)) {
      console.error('Invalid response format when fetching Jira projects:', data);
      throw new Error('Invalid response format from Jira API');
    }

    return data.map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      avatarUrl: project.avatarUrls ? project.avatarUrls['48x48'] : undefined,
      domain: domain
    }));
  } catch (error: any) {
    console.error('Error fetching Jira projects:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch Jira projects');
  }
};

export const fetchJiraSprints = async (
  credentials: JiraCredentials,
  projectId: string
): Promise<JiraSprint[]> => {
  const { domain, email, apiToken } = credentials;

  if (!domain || !email || !apiToken) {
    throw new Error('Missing Jira credentials. Please check your settings.');
  }

  try {
    // We'll use multiple approaches to fetch sprints, trying each one until we find sprints
    console.log(`Attempting to fetch sprints for project ID: ${projectId}`);
    
    // APPROACH 1: Try to get active and future sprints directly using JQL search
    console.log(`APPROACH 1: Fetching active sprints directly for project ${projectId} using JQL`);
    const { data: projectSprintData, error: projectSprintError } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        path: `search?jql=project=${projectId}%20AND%20sprint%20in%20openSprints()&fields=sprint,summary&maxResults=100`
      }
    });
    
    if (projectSprintError) {
      console.error('Error fetching project sprints directly:', projectSprintError);
      console.log('Trying next approach...');
    } else if (projectSprintData?.issues && projectSprintData.issues.length > 0) {
      // Extract unique sprints from the issues
      const sprintsSet = new Set();
      const sprints = [];
      
      // Extract sprints from each issue
      projectSprintData.issues.forEach((issue: any) => {
        const customFields = Object.keys(issue.fields).filter(key => 
          key.startsWith('customfield_') && 
          Array.isArray(issue.fields[key]) && 
          issue.fields[key].length > 0 &&
          issue.fields[key][0]?.id && 
          issue.fields[key][0]?.state
        );
        
        customFields.forEach(fieldKey => {
          const issueSprints = issue.fields[fieldKey];
          if (Array.isArray(issueSprints)) {
            issueSprints.forEach((sprint: any) => {
              if (!sprintsSet.has(sprint.id) && (sprint.state === 'active' || sprint.state === 'future')) {
                sprintsSet.add(sprint.id);
                sprints.push({
                  id: sprint.id,
                  name: sprint.name,
                  state: sprint.state,
                  startDate: sprint.startDate,
                  endDate: sprint.endDate,
                  boardId: sprint.originBoardId || 'unknown'
                });
              }
            });
          }
        });
      });
      
      if (sprints.length > 0) {
        console.log(`Found ${sprints.length} active sprints directly from issues`);
        return sprints;
      }
    }
    
    // APPROACH 2: Get agile boards for the project
    console.log(`APPROACH 2: Fetching boards for project ${projectId}`);
    const { data: boardData, error: boardError } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        path: `agile/1.0/board?projectKeyOrId=${projectId}`
      }
    });

    if (boardError) {
      console.error('Error fetching Jira boards:', boardError);
      console.log('Trying next approach...');
    } else if (boardData?.values && boardData.values.length > 0) {
      // Try each board to find sprints
      for (const board of boardData.values) {
        const boardId = board.id;
        console.log(`Checking board ID ${boardId} for sprints`);
        
        const { data: sprintData, error: sprintError } = await supabase.functions.invoke('jira-api', {
          body: {
            domain,
            email,
            apiToken,
            path: `agile/1.0/board/${boardId}/sprint?state=active,future`
          }
        });

        if (sprintError) {
          console.error(`Error fetching sprints for board ${boardId}:`, sprintError);
          continue; // Try next board
        }

        if (sprintData?.values && sprintData.values.length > 0) {
          console.log(`Successfully fetched ${sprintData.values.length} sprints for board ${boardId}`);
          
          return sprintData.values.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: sprint.state,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            boardId: boardId
          }));
        }
      }
    }
    
    // APPROACH 3: Try another JQL query approach
    console.log(`APPROACH 3: Trying alternative JQL query for sprints in project ${projectId}`);
    const { data: allIssuesData, error: allIssuesError } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        path: `search?jql=project=${projectId}&fields=id,summary,sprint&maxResults=50`
      }
    });
    
    if (!allIssuesError && allIssuesData?.issues && allIssuesData.issues.length > 0) {
      // Try to extract sprint info from any custom fields that might hold sprint data
      const sprintMap = new Map();
      
      allIssuesData.issues.forEach((issue: any) => {
        // Look through all fields for any that might be sprint fields (typically customfield_XXXXX)
        Object.entries(issue.fields).forEach(([fieldKey, fieldValue]) => {
          if (Array.isArray(fieldValue) && fieldValue.length > 0 && typeof fieldValue[0] === 'object') {
            const possibleSprints = fieldValue.filter((item: any) => 
              item && item.id && item.name && item.state &&
              (item.state === 'active' || item.state === 'future')
            );
            
            if (possibleSprints.length > 0) {
              possibleSprints.forEach((sprint: any) => {
                if (!sprintMap.has(sprint.id)) {
                  sprintMap.set(sprint.id, {
                    id: sprint.id,
                    name: sprint.name,
                    state: sprint.state,
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                    boardId: sprint.originBoardId || 'unknown'
                  });
                }
              });
            }
          }
        });
      });
      
      if (sprintMap.size > 0) {
        console.log(`Found ${sprintMap.size} sprints from issue custom fields`);
        return Array.from(sprintMap.values());
      }
    }
    
    // APPROACH 4: Try to find all possible sprints and filter by project
    console.log(`APPROACH 4: Trying to fetch all sprints across all boards`);
    const { data: allBoardsData, error: allBoardsError } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        path: `agile/1.0/board`
      }
    });
    
    if (!allBoardsError && allBoardsData?.values && allBoardsData.values.length > 0) {
      // Look for boards that might be related to our project
      const possibleBoards = allBoardsData.values.filter((board: any) => {
        if (board.location?.projectId === projectId) return true;
        if (board.location?.projectKey === projectId) return true;
        if (board.name && board.name.toLowerCase().includes(projectId.toLowerCase())) return true;
        return false;
      });
      
      if (possibleBoards.length > 0) {
        console.log(`Found ${possibleBoards.length} possible boards related to project ${projectId}`);
        
        for (const board of possibleBoards) {
          const boardId = board.id;
          const { data: boardSprintData, error: boardSprintError } = await supabase.functions.invoke('jira-api', {
            body: {
              domain,
              email,
              apiToken,
              path: `agile/1.0/board/${boardId}/sprint?state=active,future,closed`
            }
          });
          
          if (!boardSprintError && boardSprintData?.values && boardSprintData.values.length > 0) {
            console.log(`Found ${boardSprintData.values.length} sprints from board ${boardId}`);
            return boardSprintData.values.map((sprint: any) => ({
              id: sprint.id,
              name: sprint.name,
              state: sprint.state,
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              boardId: boardId
            }));
          }
        }
      }
    }
    
    // If we've exhausted all approaches and found no sprints, return an empty array
    console.log(`No active or future sprints found for project ${projectId} after trying all approaches`);
    
    // FALLBACK: Create a fake sprint for testing purposes in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Creating a test sprint for development purposes`);
      return [{
        id: '12345',
        name: 'Development Sprint (Test)',
        state: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        boardId: 'dev-board'
      }];
    }
    
    return [];
    
  } catch (error: any) {
    console.error('Error in fetchJiraSprints:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch Jira sprints');
  }
};

export const fetchJiraTickets = async (
  credentials: JiraCredentials,
  sprintId: string,
  selectedProject?: { id?: string }
): Promise<JiraTicket[]> => {
  const { domain, email, apiToken } = credentials;

  const { data, error } = await supabase.functions.invoke('jira-api', {
    body: {
      domain,
      email,
      apiToken,
      path: `agile/1.0/sprint/${sprintId}/issue`
    }
  });

  if (error) {
    console.error('Error fetching Jira tickets:', error);
    throw new Error('Failed to fetch Jira tickets');
  }

  return data.issues.map((issue: any) => {
    // Extract acceptance criteria from custom fields if available
    const acceptanceCriteria = issue.fields.customfield_10010 || '';

    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description || '',
      acceptance_criteria: acceptanceCriteria,
      status: issue.fields.status?.name,
      assignee: issue.fields.assignee?.displayName,
      priority: issue.fields.priority?.name,
      story_points: issue.fields.customfield_10008, // Assuming this is the story points field
      labels: issue.fields.labels,
      epic: issue.fields.epic?.name,
      created_at: issue.fields.created,
      updated_at: issue.fields.updated,
      issuetype: {
        id: issue.fields.issuetype.id,
        name: issue.fields.issuetype.name
      },
      projectId: selectedProject?.id,
      sprintId: sprintId,
      domain: domain
    };
  });
};

export const generateJiraContent = async (
  selectedTicket: JiraTicket,
  request: JiraGenerationRequest
): Promise<JiraGenerationResponse> => {
  // First check if the content already exists
  if (selectedTicket.key) {
    const { data: existingData, error: fetchError } = await supabase
      .from('story_artifacts')
      .select('*')
      .eq('story_id', selectedTicket.key)
      .maybeSingle();

    if (!fetchError && existingData) {
      // If we already have content, return it
      const existingContent: JiraGenerationResponse = {
        lld: existingData.lld_content || undefined,
        code: existingData.code_content || undefined,
        tests: existingData.test_content || undefined
      };

      // Only use existing content if it exists for the requested type
      if ((request.type === 'lld' && existingData.lld_content) ||
          (request.type === 'code' && existingData.code_content) ||
          (request.type === 'tests' && existingData.test_content) ||
          (request.type === 'all' && (existingData.lld_content || existingData.code_content || existingData.test_content))) {
        return existingContent;
      }
    }
  }

  // No existing content or specific content requested not available, generate new content
  const { data, error } = await supabase.functions.invoke('chat-with-jira', {
    body: {
      jiraTicket: selectedTicket,
      dataModel: request.dataModel,
      documentsContext: request.documentsContext,
      request: `Generate ${request.type === 'lld' ? 'Low-Level Design' : 
                request.type === 'code' ? 'Implementation Code' : 
                request.type === 'tests' ? 'Test Cases' : 
                'Low-Level Design, Implementation Code, and Test Cases'} for ${selectedTicket.key}: ${selectedTicket.summary}`,
      projectContext: request.projectContext,
      selectedDocuments: request.selectedDocuments
    }
  });

  if (error) {
    console.error('Error generating content:', error);
    throw new Error('Failed to generate content');
  }

  // Prepare response data
  let responseData: JiraGenerationResponse = {};

  if (request.type === 'lld' || request.type === 'all') {
    responseData.lld = data.response;
  } else if (request.type === 'code') {
    responseData.code = data.response;
  } else if (request.type === 'tests') {
    responseData.tests = data.response;
  } else {
    responseData.response = data.response;
  }

  // Save the generated content
  let contentToSave = '';
  let contentType = request.type;
  
  if (request.type === 'all') {
    // If all content was requested, save it under lld for now (we'd need to parse later)
    contentToSave = data.response;
    contentType = 'lld';
  } else {
    contentToSave = data.response;
  }

  // Save the content to the database
  await supabase.functions.invoke('save-story-artifacts', {
    body: {
      storyId: selectedTicket.key,
      projectId: selectedTicket.projectId,
      sprintId: selectedTicket.sprintId,
      contentType: contentType,
      content: contentToSave
    }
  });

  return responseData;
};

export const pushContentToJira = async (
  credentials: JiraCredentials, 
  ticketId: string, 
  content: string
): Promise<boolean> => {
  const { domain, email, apiToken } = credentials;

  // Add the comment to the Jira ticket
  const { error } = await supabase.functions.invoke('jira-api', {
    body: {
      domain,
      email,
      apiToken,
      path: `issue/${ticketId}/comment`,
      method: 'POST',
      data: {
        body: {
          version: 1,
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: content
                }
              ]
            }
          ]
        }
      }
    }
  });

  if (error) {
    console.error('Error pushing to Jira:', error);
    throw new Error('Failed to push to Jira');
  }

  return true;
};

export const saveArtifact = async (
  storyId: string,
  projectId?: string,
  sprintId?: string,
  contentType?: string,
  content?: string
): Promise<void> => {
  await supabase.functions.invoke('save-story-artifacts', {
    body: {
      storyId,
      projectId,
      sprintId,
      contentType,
      content
    }
  });
};
