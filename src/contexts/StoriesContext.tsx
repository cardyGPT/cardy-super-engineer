
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, StoriesContextType, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';
import { useToast } from "@/hooks/use-toast";

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export const useStories = () => {
  const context = useContext(StoriesContext);
  if (!context) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
};

export const StoriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [sprints, setSprints] = useState<Record<string, JiraSprint[]>>({});
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse | null>(null);
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string | null>(null);
  const { toast } = useToast();

  // Load credentials from localStorage on mount
  useEffect(() => {
    const loadCredentials = () => {
      try {
        const savedCreds = localStorage.getItem('jira_credentials');
        if (savedCreds) {
          const parsedCreds = JSON.parse(savedCreds) as JiraCredentials;
          setCredentials(parsedCreds);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error loading Jira credentials:', err);
        localStorage.removeItem('jira_credentials');
      }
    };

    loadCredentials();
  }, []);

  // Reset state when credentials change
  useEffect(() => {
    if (credentials) {
      localStorage.setItem('jira_credentials', JSON.stringify(credentials));
      setIsAuthenticated(true);
      // Load projects when credentials are set
      fetchProjects();
    } else {
      localStorage.removeItem('jira_credentials');
      setIsAuthenticated(false);
      setProjects([]);
      setSprints({});
      setTickets([]);
      setSelectedProject(null);
      setSelectedSprint(null);
      setSelectedTicket(null);
    }
  }, [credentials]);

  const fetchProjects = async () => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { domain, email, apiToken } = credentials;

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
        throw new Error('Failed to fetch Jira projects');
      }

      const projectsData: JiraProject[] = data.map((project: any) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        avatarUrl: project.avatarUrls['48x48'],
        domain: domain
      }));

      setProjects(projectsData);
    } catch (err: any) {
      console.error('Error fetching Jira projects:', err);
      setError(err.message || 'Failed to fetch Jira projects');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira projects',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSprints = async (projectId?: string) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    const projectToUse = projectId || selectedProject?.id;

    if (!projectToUse) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { domain, email, apiToken } = credentials;

      // First get agile boards for the project
      const { data: boardData, error: boardError } = await supabase.functions.invoke('jira-api', {
        body: {
          domain,
          email,
          apiToken,
          path: `agile/1.0/board?projectKeyOrId=${projectToUse}`
        }
      });

      if (boardError) {
        console.error('Error fetching Jira boards:', boardError);
        throw new Error('Failed to fetch Jira boards');
      }

      if (!boardData.values || boardData.values.length === 0) {
        setSprints({ ...sprints, [projectToUse]: [] });
        setLoading(false);
        return;
      }

      // Use the first board to get sprints
      const boardId = boardData.values[0].id;

      const { data: sprintData, error: sprintError } = await supabase.functions.invoke('jira-api', {
        body: {
          domain,
          email,
          apiToken,
          path: `agile/1.0/board/${boardId}/sprint`
        }
      });

      if (sprintError) {
        console.error('Error fetching Jira sprints:', sprintError);
        throw new Error('Failed to fetch Jira sprints');
      }

      const sprintsData: JiraSprint[] = sprintData.values.map((sprint: any) => ({
        id: sprint.id,
        name: sprint.name,
        state: sprint.state,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        boardId: boardId
      }));

      setSprints({ ...sprints, [projectToUse]: sprintsData });
    } catch (err: any) {
      console.error('Error fetching Jira sprints:', err);
      setError(err.message || 'Failed to fetch Jira sprints');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira sprints',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (sprintId?: string) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    const sprintToUse = sprintId || selectedSprint?.id;

    if (!sprintToUse) {
      setError('No sprint selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { domain, email, apiToken } = credentials;

      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          domain,
          email,
          apiToken,
          path: `agile/1.0/sprint/${sprintToUse}/issue`
        }
      });

      if (error) {
        console.error('Error fetching Jira tickets:', error);
        throw new Error('Failed to fetch Jira tickets');
      }

      const ticketsData: JiraTicket[] = data.issues.map((issue: any) => {
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
          sprintId: sprintToUse,
          domain: domain
        };
      });

      setTickets(ticketsData);
    } catch (err: any) {
      console.error('Error fetching Jira tickets:', err);
      setError(err.message || 'Failed to fetch Jira tickets');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira tickets',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (request: JiraGenerationRequest): Promise<JiraGenerationResponse | void> => {
    if (!selectedTicket) {
      setError('No ticket selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First check if the content already exists
      if (selectedTicket.id) {
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
            setGeneratedContent(existingContent);
            setLoading(false);
            
            toast({
              title: "Content Retrieved",
              description: "Retrieved previously generated content",
              variant: "success",
            });
            
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

      setGeneratedContent(responseData);
      
      toast({
        title: "Content Generated",
        description: "Content has been generated and saved successfully",
        variant: "success",
      });
      
      return responseData;
    } catch (err: any) {
      console.error('Error generating content:', err);
      setError(err.message || 'Failed to generate content');
      toast({
        title: "Error",
        description: err.message || 'Failed to generate content',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pushToJira = async (ticketId: string, content: string): Promise<boolean> => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return false;
    }

    try {
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

      toast({
        title: "Success",
        description: "Content has been pushed to Jira",
        variant: "success",
      });

      return true;
    } catch (err: any) {
      console.error('Error pushing to Jira:', err);
      setError(err.message || 'Failed to push to Jira');
      toast({
        title: "Error",
        description: err.message || 'Failed to push to Jira',
        variant: "destructive",
      });
      return false;
    }
  };

  // Filter tickets based on the selected type
  const filteredTickets = ticketTypeFilter
    ? tickets.filter(ticket => ticket.issuetype?.name === ticketTypeFilter)
    : tickets;

  return (
    <StoriesContext.Provider
      value={{
        credentials,
        setCredentials,
        isAuthenticated,
        tickets: filteredTickets,
        loading,
        error,
        projects,
        sprints,
        selectedProject,
        setSelectedProject,
        selectedSprint,
        setSelectedSprint,
        fetchProjects,
        fetchSprints,
        fetchTickets,
        selectedTicket,
        setSelectedTicket,
        generatedContent,
        generateContent,
        pushToJira,
        ticketTypeFilter,
        setTicketTypeFilter
      }}
    >
      {children}
    </StoriesContext.Provider>
  );
};

export default StoriesContext;
