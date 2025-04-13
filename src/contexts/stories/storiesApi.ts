
import { supabase } from '@/lib/supabase';
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';

const DEV_MODE = true; // Set to true to enable development mode with test data

// Helper function to fetch from Jira API through our edge function
const callJiraApi = async (credentials: JiraCredentials, path: string, method: string = 'GET', data?: any) => {
  const { domain, email, apiToken } = credentials;
  
  try {
    const { data: responseData, error } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        path,
        method,
        data
      }
    });

    if (error) {
      console.error('Error calling Jira API:', error);
      throw new Error(error.message || 'Failed to call Jira API');
    }

    return responseData;
  } catch (error) {
    console.error('Error in callJiraApi:', error);
    throw error;
  }
};

export const fetchJiraProjects = async (credentials: JiraCredentials): Promise<JiraProject[]> => {
  try {
    const data = await callJiraApi(credentials, 'project');
    
    // Transform the response into our JiraProject format
    return data.map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      avatarUrl: project.avatarUrls?.['48x48'],
      domain: credentials.domain
    }));
  } catch (error) {
    console.error('Error fetching Jira projects:', error);
    throw error;
  }
};

export const fetchJiraSprints = async (credentials: JiraCredentials, projectId: string): Promise<JiraSprint[]> => {
  console.log(`Attempting to fetch sprints for project ID: ${projectId}`);
  
  try {
    // APPROACH 1: Try to fetch active sprints directly using JQL
    console.log(`APPROACH 1: Fetching active sprints directly for project ${projectId} using JQL`);
    const jqlQuery = `project = ${projectId} AND sprint in openSprints()`;
    const activeSprintsData = await callJiraApi(credentials, `search?jql=${encodeURIComponent(jqlQuery)}&maxResults=1`);
    
    if (activeSprintsData.issues && activeSprintsData.issues.length > 0) {
      // Extract sprint info from the first issue
      const sprints = activeSprintsData.issues[0].fields?.sprint || [];
      if (Array.isArray(sprints) && sprints.length > 0) {
        return sprints.map((sprint: any) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          boardId: sprint.originBoardId || '0'
        }));
      }
    }
    
    // APPROACH 2: If no active sprints found with JQL, try getting boards for the project
    console.log(`APPROACH 2: Fetching boards for project ${projectId}`);
    const boardsData = await callJiraApi(credentials, `agile/1.0/board?projectKeyOrId=${projectId}`);
    
    if (boardsData.values && boardsData.values.length > 0) {
      // For each board, try to fetch active sprints
      for (const board of boardsData.values) {
        try {
          const sprintsData = await callJiraApi(credentials, `agile/1.0/board/${board.id}/sprint?state=active,future`);
          
          if (sprintsData.values && sprintsData.values.length > 0) {
            return sprintsData.values.map((sprint: any) => ({
              id: sprint.id,
              name: sprint.name,
              state: sprint.state,
              startDate: sprint.startDate,
              endDate: sprint.endDate,
              boardId: board.id
            }));
          }
        } catch (err) {
          console.error(`Error fetching sprints for board ${board.id}:`, err);
          // Continue to next board if this one fails
        }
      }
    }
    
    // APPROACH 3: Try another JQL query variation
    console.log(`APPROACH 3: Trying alternative JQL query for sprints in project ${projectId}`);
    const alternativeJql = `project = ${projectId} AND sprint not in closedSprints()`;
    const altSprintsData = await callJiraApi(credentials, `search?jql=${encodeURIComponent(alternativeJql)}&maxResults=1`);
    
    if (altSprintsData.issues && altSprintsData.issues.length > 0) {
      const issue = altSprintsData.issues[0];
      const sprints = issue.fields?.sprint || [];
      if (Array.isArray(sprints) && sprints.length > 0) {
        return sprints.map((sprint: any) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state || 'active',
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          boardId: sprint.originBoardId || '0'
        }));
      }
    }
    
    // APPROACH 4: Last resort - get all sprints across all boards
    console.log(`APPROACH 4: Trying to fetch all sprints across all boards`);
    const allBoardsData = await callJiraApi(credentials, `agile/1.0/board`);
    
    if (allBoardsData.values && allBoardsData.values.length > 0) {
      for (const board of allBoardsData.values.slice(0, 5)) { // Limit to first 5 boards to avoid too many requests
        try {
          const sprintsData = await callJiraApi(credentials, `agile/1.0/board/${board.id}/sprint?state=active`);
          
          if (sprintsData.values && sprintsData.values.length > 0) {
            // For each sprint, check if it contains issues from our project
            for (const sprint of sprintsData.values) {
              try {
                const sprintIssuesJql = `project = ${projectId} AND sprint = ${sprint.id}`;
                const sprintIssuesData = await callJiraApi(credentials, `search?jql=${encodeURIComponent(sprintIssuesJql)}&maxResults=1`);
                
                if (sprintIssuesData.issues && sprintIssuesData.issues.length > 0) {
                  // This sprint contains issues from our project, so return it
                  return [{
                    id: sprint.id,
                    name: sprint.name,
                    state: sprint.state,
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                    boardId: board.id
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
      console.log(`[DEV MODE] Creating a test sprint for development purposes`);
      const testSprint: JiraSprint = {
        id: `test-${projectId}`,
        name: `Development Sprint (Test) (active)`,
        state: 'active',
        boardId: '0',
      };
      return [testSprint];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Jira sprints:', error);
    throw error;
  }
};

export const fetchJiraTickets = async (
  credentials: JiraCredentials, 
  sprintId: string,
  selectedProject: JiraProject | null
): Promise<JiraTicket[]> => {
  try {
    if (!selectedProject) {
      throw new Error('No project selected');
    }
    
    // Handle test sprint in dev mode
    if (DEV_MODE && sprintId.startsWith('test-')) {
      console.log(`[DEV MODE] Creating test tickets for test sprint ${sprintId}`);
      const projectId = sprintId.replace('test-', '');
      
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
      console.log('No issues found in sprint, returning empty array');
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

export const generateJiraContent = async (
  ticket: JiraTicket,
  request: JiraGenerationRequest
): Promise<JiraGenerationResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('chat-with-jira', {
      body: {
        jiraTicket: ticket,
        dataModel: request.dataModel || null,
        documentsContext: request.documentsContext || null,
        request: request.type === 'lld' ? 'Generate a Low-Level Design' :
                request.type === 'code' ? 'Generate Implementation Code' :
                request.type === 'tests' ? 'Generate Test Cases' : 'Generate all content',
        projectContext: request.projectContext || null,
        selectedDocuments: request.selectedDocuments || []
      }
    });

    if (error) {
      console.error('Error generating content:', error);
      throw new Error(error.message || 'Failed to generate content');
    }

    // Save the generated content to our database
    try {
      await saveGeneratedContent(ticket, request.type, data.response);
    } catch (saveError) {
      console.error('Error saving generated content:', saveError);
      // Continue even if saving fails
    }

    // Return the response based on the request type
    if (request.type === 'lld') {
      return { lld: data.response };
    } else if (request.type === 'code') {
      return { code: data.response };
    } else if (request.type === 'tests') {
      return { tests: data.response };
    } else {
      // Split the response into sections for 'all' type
      return {
        response: data.response,
        // Additional processing could be done here to extract sections
      };
    }
  } catch (error) {
    console.error('Error in generateJiraContent:', error);
    throw error;
  }
};

const saveGeneratedContent = async (ticket: JiraTicket, contentType: string, content: string) => {
  if (!ticket || !ticket.key || !contentType || !content) return;

  try {
    const { data, error } = await supabase.functions.invoke('save-story-artifacts', {
      body: {
        storyId: ticket.key,
        projectId: ticket.projectId,
        sprintId: ticket.sprintId,
        contentType, 
        content
      }
    });

    if (error) {
      console.error('Error saving generated content:', error);
      throw new Error(error.message || 'Failed to save generated content');
    }

    return data;
  } catch (error) {
    console.error('Error in saveGeneratedContent:', error);
    throw error;
  }
};

export const pushContentToJira = async (
  credentials: JiraCredentials,
  ticketId: string,
  content: string
): Promise<boolean> => {
  try {
    // Format content for Jira's ADFV2 format
    const formattedContent = {
      body: {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: content
              }
            ]
          }
        ]
      }
    };

    // Push to Jira as a comment
    await callJiraApi(
      credentials,
      `issue/${ticketId}/comment`,
      'POST',
      formattedContent
    );

    return true;
  } catch (error) {
    console.error('Error pushing content to Jira:', error);
    throw error;
  }
};
