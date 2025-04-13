
import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';
import { 
  fetchJiraProjects, 
  fetchJiraSprints, 
  fetchJiraTickets, 
  fetchJiraTicketsByProject, 
  generateJiraContent, 
  pushContentToJira,
  saveGeneratedContent 
} from './api';

export const useStoriesState = () => {
  const { toast } = useToast();
  
  // Authentication state
  const [credentials, setCredentials] = useState<JiraCredentials | null>(() => {
    // Try to load credentials from localStorage on initialization
    try {
      const savedCredentials = localStorage.getItem('jira_credentials');
      return savedCredentials ? JSON.parse(savedCredentials) : null;
    } catch (err) {
      console.error('Failed to load credentials from localStorage:', err);
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [sprints, setSprints] = useState<Record<string, JiraSprint[]>>({});
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  
  // Pagination state
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  
  // Loading states
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Selection states
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  
  // Filters
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Generated content
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse | null>(null);
  
  // Computed state - combined loading state
  const loading = projectsLoading || sprintsLoading || ticketsLoading || contentLoading;
  
  // Computed state - authentication status
  const isAuthenticated = !!credentials;

  // Save credentials to localStorage when they change
  useEffect(() => {
    if (credentials) {
      localStorage.setItem('jira_credentials', JSON.stringify(credentials));
    } else {
      localStorage.removeItem('jira_credentials');
    }
  }, [credentials]);

  // Auto-fetch projects when credentials are available
  useEffect(() => {
    if (credentials && projects.length === 0 && !projectsLoading) {
      console.log('Auto-fetching projects on credentials load');
      fetchProjects();
    }
  }, [credentials]);
  
  // Reset selected ticket when filters change
  useEffect(() => {
    setSelectedTicket(null);
  }, [ticketTypeFilter, searchTerm]);
  
  // API method - Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }
    
    setProjectsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching Jira projects...');
      const projectsData = await fetchJiraProjects(credentials);
      
      setProjects(projectsData);
      console.log(`Fetched ${projectsData.length} projects`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch Jira projects';
      console.error('Error fetching projects:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProjectsLoading(false);
    }
  }, [credentials, toast]);
  
  // API method - Fetch sprints
  const fetchSprints = useCallback(async (projectId: string) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }
    
    setSprintsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching sprints for project ${projectId}...`);
      const sprintsData = await fetchJiraSprints(credentials, projectId);
      
      // Update sprints state with new data for this project
      setSprints(prev => ({ ...prev, [projectId]: sprintsData }));
      
      if (sprintsData.length === 0) {
        console.log(`No sprints found for project ${projectId}`);
        toast({
          title: "No Sprints Found",
          description: "This project doesn't have any sprints available. Try viewing all stories from the project instead.",
          variant: "default",
        });
      } else {
        console.log(`Fetched ${sprintsData.length} sprints for project ${projectId}`);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch Jira sprints';
      console.error('Error fetching sprints:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Set empty array for this project to prevent loading state
      setSprints(prev => ({ ...prev, [projectId]: [] }));
    } finally {
      setSprintsLoading(false);
    }
  }, [credentials, toast]);
  
  // API method - Fetch initial tickets
  const fetchTickets = useCallback(async (sprintId: string) => {
    if (!credentials || !selectedProject) {
      setError('Missing credentials or project selection');
      return;
    }
    
    setTicketsLoading(true);
    setError(null);
    setCurrentPage(0);
    
    try {
      console.log(`Fetching tickets for sprint ${sprintId}...`);
      const { tickets: ticketsData, total } = await fetchJiraTickets(
        credentials, 
        sprintId, 
        selectedProject,
        0,
        pageSize
      );
      
      setTickets(ticketsData);
      setTotalTickets(total);
      setHasMore(ticketsData.length < total);
      console.log(`Fetched ${ticketsData.length} tickets for sprint ${sprintId} (total: ${total})`);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch Jira tickets';
      console.error('Error fetching tickets:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setTickets([]);
      setTotalTickets(0);
      setHasMore(false);
    } finally {
      setTicketsLoading(false);
    }
  }, [credentials, selectedProject, pageSize, toast]);

  // API method - Fetch more tickets (lazy loading)
  const fetchMoreTickets = useCallback(async () => {
    if (!credentials || !selectedProject || (!selectedSprint && !loadFromProject)) {
      return;
    }
    
    if (loadingMore || !hasMore) {
      return;
    }
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const startAt = nextPage * pageSize;
    
    try {
      console.log(`Fetching more tickets, startAt: ${startAt}, pageSize: ${pageSize}`);
      let result;
      
      if (selectedSprint) {
        result = await fetchJiraTickets(
          credentials,
          selectedSprint.id,
          selectedProject,
          startAt,
          pageSize
        );
      } else {
        result = await fetchJiraTicketsByProject(
          credentials,
          selectedProject,
          startAt,
          pageSize
        );
      }
      
      const { tickets: newTickets, total } = result;
      
      setTickets(prev => [...prev, ...newTickets]);
      setTotalTickets(total);
      setCurrentPage(nextPage);
      setHasMore(startAt + newTickets.length < total);
      
      console.log(`Loaded ${newTickets.length} more tickets (total: ${total})`);
    } catch (err) {
      console.error('Error fetching more tickets:', err);
      toast({
        title: "Error",
        description: "Failed to load more tickets",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [credentials, selectedProject, selectedSprint, currentPage, pageSize, hasMore, loadingMore, loadFromProject, toast]);

  // Track whether we're loading from project directly instead of sprint
  const [loadFromProject, setLoadFromProject] = useState(false);
  
  // API method - Fetch tickets directly from a project
  const fetchTicketsByProject = useCallback(async (projectId: string) => {
    if (!credentials || !selectedProject) {
      setError('Missing credentials or project selection');
      return;
    }
    
    setTicketsLoading(true);
    setError(null);
    setSelectedSprint(null); // Clear sprint selection since we're getting all project tickets
    setCurrentPage(0);
    setLoadFromProject(true);
    
    try {
      console.log(`Fetching tickets for project ${projectId}...`);
      const { tickets: ticketsData, total } = await fetchJiraTicketsByProject(
        credentials,
        selectedProject,
        0,
        pageSize
      );
      
      setTickets(ticketsData);
      setTotalTickets(total);
      setHasMore(ticketsData.length < total);
      
      console.log(`Fetched ${ticketsData.length} tickets for project ${projectId} (total: ${total})`);
      
      toast({
        title: "Project Stories Loaded",
        description: `Loaded ${ticketsData.length} stories from the project directly.`,
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch Jira tickets';
      console.error('Error fetching project tickets:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setTickets([]);
      setTotalTickets(0);
      setHasMore(false);
    } finally {
      setTicketsLoading(false);
    }
  }, [credentials, selectedProject, pageSize, toast]);
  
  // When switching back to sprint, clear the loadFromProject flag
  useEffect(() => {
    if (selectedSprint) {
      setLoadFromProject(false);
    }
  }, [selectedSprint]);
  
  // API method - Generate content
  const generateContent = useCallback(async (request: JiraGenerationRequest): Promise<JiraGenerationResponse | void> => {
    if (!credentials || !selectedTicket) {
      setError('Missing credentials or ticket selection');
      return;
    }
    
    setContentLoading(true);
    setError(null);
    
    try {
      console.log(`Generating ${request.type} content for ticket ${selectedTicket.key}...`);
      const responseData = await generateJiraContent(selectedTicket, request);
      
      setGeneratedContent(responseData);
      console.log('Content generated successfully');
      
      // Save the generated content to the database for persistence
      if (responseData) {
        try {
          await saveGeneratedContent(
            selectedTicket.id, 
            selectedTicket.projectId || '', 
            selectedTicket.sprintId || '', 
            request.type, 
            responseData[request.type] || responseData.response || ''
          );
          console.log('Content saved to database');
        } catch (saveError) {
          console.error('Error saving content to database:', saveError);
          // Don't fail the overall operation if save fails
        }
      }
      
      toast({
        title: "Content Generated",
        description: `${request.type.toUpperCase()} content was generated successfully.`,
        variant: "default",
      });
      
      return responseData;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate content';
      console.error('Error generating content:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setContentLoading(false);
    }
  }, [credentials, selectedTicket, toast]);
  
  // API method - Push to Jira
  const pushToJira = useCallback(async (ticketId: string, content: string): Promise<boolean> => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return false;
    }
    
    setContentLoading(true);
    setError(null);
    
    try {
      console.log(`Pushing content to Jira ticket ${ticketId}...`);
      const success = await pushContentToJira(credentials, ticketId, content);
      
      console.log('Content pushed to Jira successfully');
      toast({
        title: "Success",
        description: "Content was pushed to Jira successfully.",
        variant: "default",
      });
      
      return success;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to push content to Jira';
      console.error('Error pushing to Jira:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setContentLoading(false);
    }
  }, [credentials, toast]);
  
  // Utility method - Refresh all data
  const refreshAll = useCallback(async () => {
    try {
      await fetchProjects();
      
      if (selectedProject) {
        await fetchSprints(selectedProject.id);
        
        if (selectedSprint) {
          await fetchTickets(selectedSprint.id);
        } else if (loadFromProject) {
          await fetchTicketsByProject(selectedProject.id);
        }
      }
      
      toast({
        title: "Refreshed",
        description: "Jira data has been refreshed.",
        variant: "default",
      });
    } catch (err: any) {
      console.error('Error in refreshAll:', err);
      toast({
        title: "Error",
        description: "Failed to refresh Jira data.",
        variant: "destructive",
      });
    }
  }, [fetchProjects, fetchSprints, fetchTickets, fetchTicketsByProject, selectedProject, selectedSprint, loadFromProject, toast]);
  
  return {
    // Authentication
    credentials,
    setCredentials,
    isAuthenticated,
    error,
    
    // Data
    projects,
    sprints,
    tickets,
    
    // Pagination
    totalTickets,
    currentPage,
    pageSize,
    hasMore,
    loadingMore,
    fetchMoreTickets,
    
    // Loading states
    loading,
    projectsLoading,
    sprintsLoading,
    ticketsLoading,
    contentLoading,
    
    // Selection states
    selectedProject,
    setSelectedProject,
    selectedSprint,
    setSelectedSprint,
    selectedTicket,
    setSelectedTicket,
    
    // Filters
    ticketTypeFilter,
    setTicketTypeFilter,
    searchTerm,
    setSearchTerm,
    
    // Generated content
    generatedContent,
    
    // API calls
    fetchProjects,
    fetchSprints,
    fetchTickets,
    fetchTicketsByProject,
    generateContent,
    pushToJira,
    
    // Utility
    refreshAll
  };
};
