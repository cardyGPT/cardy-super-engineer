
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

  // Reset affected states when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      // When project changes, clear selected sprint and ticket
      setSelectedSprint(null);
      setSelectedTicket(null);
      setTickets([]);
      
      // If we already have sprints for this project, no need to fetch
      if (!sprints[selectedProject.id] || sprints[selectedProject.id].length === 0) {
        fetchSprints(selectedProject.id);
      }
    }
  }, [selectedProject]);

  // Reset ticket selection when selectedSprint changes
  useEffect(() => {
    if (selectedSprint) {
      setSelectedTicket(null);
      
      // Fetch tickets for the selected sprint
      fetchTickets(selectedSprint.id);
    } else {
      setTickets([]);
    }
  }, [selectedSprint]);

  const fetchProjects = async () => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching Jira projects...');
      const projectsData = await fetchJiraProjects(credentials);
      setProjects(projectsData);
      console.log(`Fetched ${projectsData.length} Jira projects`);
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
      
      // Check if sprints received are for the current selected project
      // This prevents race conditions where project was changed during fetch
      if (selectedProject && selectedProject.id === projectToUse) {
        setSprints(prev => ({ ...prev, [projectToUse]: sprintsData }));
      } else {
        // If project id changed, still update sprints for that project
        setSprints(prev => ({ ...prev, [projectToUse]: sprintsData }));
      }
      
      // Clear tickets when sprints change for the current project
      if (selectedProject && selectedProject.id === projectToUse) {
        setTickets([]);
        setSelectedTicket(null);
        
        // If there's only one sprint, select it automatically
        if (sprintsData.length === 1) {
          setSelectedSprint(sprintsData[0]);
          fetchTickets(sprintsData[0].id);
        }
      }
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

    if (!selectedProject) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching tickets for sprint ID: ${sprintToUse} in project ID: ${selectedProject.id}`);
      const ticketsData = await fetchJiraTickets(credentials, sprintToUse, selectedProject);
      
      console.log(`Found ${ticketsData.length} tickets for sprint ID: ${sprintToUse}`);
      setTickets(ticketsData);
    } catch (err: any) {
      console.error('Error fetching Jira tickets:', err);
      setError(err.message || 'Failed to fetch Jira tickets');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira tickets',
        variant: "destructive",
      });
      // Ensure tickets is at least an empty array on error
      setTickets([]);
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
