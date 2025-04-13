
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
    // Try to get all active and future sprints for the project directly
    console.log(`Attempting to fetch active sprints directly for project ${projectId}`);
    const { data: projectSprintData, error: projectSprintError } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        // Try to get active sprints directly using JQL
        path: `search?jql=project=${projectId}%20AND%20sprint%20in%20openSprints()&fields=sprint`
      }
    });
    
    if (projectSprintError) {
      console.error('Error fetching project sprints directly:', projectSprintError);
      throw new Error(projectSprintError.message || 'Failed to fetch sprints directly');
    }
    
    if (projectSprintData?.issues && projectSprintData.issues.length > 0) {
      // Extract unique sprints from the issues
      const sprintsSet = new Set();
      const sprints = [];
      
      // Extract sprints from each issue
      projectSprintData.issues.forEach((issue: any) => {
        const issueSprints = issue.fields.sprint || [];
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
      
      if (sprints.length > 0) {
        console.log(`Found ${sprints.length} active sprints directly from issues`);
        return sprints;
      }
    }
    
    // If no sprints from issues, try the agile API
    // First get agile boards for the project
    console.log(`Fetching boards for project ${projectId}`);
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
      throw new Error(`Failed to fetch Jira boards: ${boardError.message}`);
    }

    // Check if values array exists and has items
    if (!boardData.values || boardData.values.length === 0) {
      console.log('No boards found for this project, trying to fetch all active sprints');
      
      // Try a different approach - get all active sprints regardless of board
      const { data: allSprintsData, error: allSprintsError } = await supabase.functions.invoke('jira-api', {
        body: {
          domain,
          email,
          apiToken,
          path: `search?jql=project=${projectId}%20AND%20sprint%20not%20in%20closedSprints()&maxResults=100`
        }
      });
      
      if (allSprintsError) {
        console.error('Error fetching all sprints:', allSprintsError);
        return [];
      }
      
      if (allSprintsData && allSprintsData.total > 0) {
        // Try to extract sprint info from the issues
        console.log(`Found ${allSprintsData.total} issues in active sprints`);
        return [];
      }
      
      return [];
    }

    // Use the first board to get sprints
    const boardId = boardData.values[0].id;
    console.log(`Using board ID ${boardId} to fetch sprints`);

    const { data: sprintData, error: sprintError } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        path: `agile/1.0/board/${boardId}/sprint?state=active,future`
      }
    });

    if (sprintError) {
      console.error('Error fetching Jira sprints:', sprintError);
      throw new Error(`Failed to fetch Jira sprints: ${sprintError.message}`);
    }

    if (!sprintData) {
      console.warn('No sprint data returned from Jira API');
      return [];
    }

    // Check if values array exists
    if (!sprintData.values) {
      console.warn('Invalid sprint data format:', sprintData);
      return [];
    }

    console.log(`Successfully fetched ${sprintData.values.length} sprints for board ${boardId}`);
    
    return sprintData.values.map((sprint: any) => ({
      id: sprint.id,
      name: sprint.name,
      state: sprint.state,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      boardId: boardId
    }));
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
