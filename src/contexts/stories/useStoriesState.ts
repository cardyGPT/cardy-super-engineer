
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';
import { StoriesContextState, StoriesContextActions } from './types';
import { fetchJiraProjects, fetchJiraSprints, fetchJiraTickets, generateJiraContent, pushContentToJira } from './storiesApi';

export const useStoriesState = (): StoriesContextState & StoriesContextActions => {
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
      const projectsData = await fetchJiraProjects(credentials);
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
      console.log(`Fetching sprints for project ID: ${projectToUse}`);
      const sprintsData = await fetchJiraSprints(credentials, projectToUse);
      
      if (sprintsData.length === 0) {
        console.log(`No sprints found for project ID: ${projectToUse}`);
      } else {
        console.log(`Found ${sprintsData.length} sprints for project ID: ${projectToUse}`);
      }
      
      setSprints(prev => ({ ...prev, [projectToUse]: sprintsData }));
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
      const ticketsData = await fetchJiraTickets(credentials, sprintToUse, selectedProject);
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
      const responseData = await generateJiraContent(selectedTicket, request);
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
      const success = await pushContentToJira(credentials, ticketId, content);
      
      toast({
        title: "Success",
        description: "Content has been pushed to Jira",
        variant: "success",
      });

      return success;
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

  return {
    credentials,
    setCredentials,
    isAuthenticated,
    tickets: ticketTypeFilter
      ? tickets.filter(ticket => ticket.issuetype?.name === ticketTypeFilter)
      : tickets,
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
  };
};
