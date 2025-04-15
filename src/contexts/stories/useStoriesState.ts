import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from '@/contexts/stories/hooks/useAuthState';
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';
import { fetchJiraProjects, fetchJiraSprints, fetchJiraTickets, generateJiraContent, pushContentToJira } from './api';
import { supabase } from '@/lib/supabase';
import { ContentType } from '@/components/stories/ContentDisplay';

// Type definition for the state
export interface StoriesContextState {
  // Authentication
  credentials: JiraCredentials | null;
  isAuthenticated: boolean;
  error: string | null;
  
  // Data
  projects: JiraProject[];
  sprints: Record<string, JiraSprint[]>;
  tickets: JiraTicket[];
  
  // Loading states
  loading: boolean;
  projectsLoading: boolean;
  sprintsLoading: boolean;
  ticketsLoading: boolean;
  contentLoading: boolean;
  
  // Selection states
  selectedProject: JiraProject | null;
  selectedSprint: JiraSprint | null;
  selectedTicket: JiraTicket | null;
  
  // Filters
  ticketTypeFilter: string | null;
  ticketStatusFilter: string | null;
  searchTerm: string;
  
  // Extra data
  totalTickets: number;
  apiType: 'agile' | 'classic' | 'cloud';
  
  // Generated content
  generatedContent: JiraGenerationResponse | null;
  
  // Actions
  setCredentials: (creds: JiraCredentials | null) => void;
  setSelectedProject: (project: JiraProject | null) => void;
  setSelectedSprint: (sprint: JiraSprint | null) => void;
  setSelectedTicket: (ticket: JiraTicket | null) => void;
  setTicketTypeFilter: (type: string | null) => void;
  setTicketStatusFilter: (status: string | null) => void;
  setSearchTerm: (term: string) => void;
  setApiType: (type: 'agile' | 'classic' | 'cloud') => void;
  
  // API calls
  fetchProjects: () => Promise<void>;
  fetchSprints: (projectId: string) => Promise<void>;
  fetchTickets: (sprintId: string) => Promise<void>;
  fetchTicketsByProject: (projectId: string) => Promise<void>;
  generateContent: (request: JiraGenerationRequest) => Promise<JiraGenerationResponse | void>;
  pushToJira: (ticketId: string, content: string) => Promise<boolean>;
  saveContentToDatabase: (contentType: ContentType, content: string) => Promise<boolean>;
  
  // Utility
  refreshAll: () => Promise<void>;
  fetchMoreTickets: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

export const useStoriesState = (): StoriesContextState => {
  // Authentication state
  const { credentials, isAuthenticated, setCredentials, error: authError } = useAuthState();
  
  // UI State
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiType, setApiType] = useState<'agile' | 'classic' | 'cloud'>('agile');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string | null>(null);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string | null>(null);
  
  // Data state
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [sprints, setSprints] = useState<Record<string, JiraSprint[]>>({});
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse | null>(null);
  
  // Loading state
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Selection state
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  
  // Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [startAt, setStartAt] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  
  const { toast } = useToast();

  // Project and Sprint Handling
  const fetchProjects = useCallback(async () => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    setProjectsLoading(true);
    setError(null);

    try {
      const fetchedProjects = await fetchJiraProjects(credentials);
      setProjects(fetchedProjects);
    } catch (err: any) {
      console.error('Error fetching Jira projects:', err);
      setError(err.message || 'Failed to fetch Jira projects');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira projects',
        variant: "destructive",
      });
    } finally {
      setProjectsLoading(false);
    }
  }, [credentials, toast]);

  const fetchSprints = useCallback(async (projectId: string) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    setSprintsLoading(true);
    setError(null);

    try {
      const fetchedSprints = await fetchJiraSprints(credentials, projectId, apiType);
      setSprints(prevSprints => ({ ...prevSprints, [projectId]: fetchedSprints }));
    } catch (err: any) {
      console.error('Error fetching Jira sprints:', err);
      setError(err.message || 'Failed to fetch Jira sprints');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira sprints',
        variant: "destructive",
      });
    } finally {
      setSprintsLoading(false);
    }
  }, [credentials, apiType, toast]);

  // Ticket Handling
  const fetchTickets = useCallback(async (sprintId: string) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    if (!selectedProject) {
      setError('No project selected');
      return;
    }

    setTicketsLoading(true);
    setError(null);
    setStartAt(0);
    setHasMore(true);

    try {
      const result = await fetchJiraTickets(
        credentials, 
        sprintId, 
        selectedProject, 
        0, 
        100, // Increased from 50 to 100 to load more tickets initially
        { 
          type: ticketTypeFilter, 
          status: ticketStatusFilter 
        }
      );
      setTickets(result.tickets);
      setTotalTickets(result.total);
      setHasMore(result.tickets.length < result.total);
    } catch (err: any) {
      console.error('Error fetching Jira tickets:', err);
      setError(err.message || 'Failed to fetch Jira tickets');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira tickets',
        variant: "destructive",
      });
      setTickets([]);
      setTotalTickets(0);
    } finally {
      setTicketsLoading(false);
    }
  }, [credentials, selectedProject, ticketTypeFilter, ticketStatusFilter, toast]);
  
  const fetchTicketsByProject = useCallback(async (projectId: string) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    if (!selectedProject) {
      setError('No project selected');
      return;
    }

    setTicketsLoading(true);
    setError(null);
    setStartAt(0);
    setHasMore(true);

    try {
      const result = await fetchJiraTickets(
        credentials, 
        projectId, 
        selectedProject, 
        0, 
        100, // Increased from 50 to 100 to load more tickets initially
        { 
          type: ticketTypeFilter, 
          status: ticketStatusFilter 
        }
      );
      setTickets(result.tickets);
      setTotalTickets(result.total);
      setHasMore(result.tickets.length < result.total);
    } catch (err: any) {
      console.error('Error fetching Jira tickets:', err);
      setError(err.message || 'Failed to fetch Jira tickets');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira tickets',
        variant: "destructive",
      });
      setTickets([]);
      setTotalTickets(0);
    } finally {
      setTicketsLoading(false);
    }
  }, [credentials, selectedProject, ticketTypeFilter, ticketStatusFilter, toast]);

  const fetchMoreTickets = useCallback(async () => {
    if (!credentials || !selectedSprint || !selectedProject || !hasMore || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const newStartAt = startAt + 100; // Increased from 50 to 100
      const result = await fetchJiraTickets(
        credentials, 
        selectedSprint.id, 
        selectedProject, 
        newStartAt, 
        100, // Increased from 50 to 100
        { 
          type: ticketTypeFilter, 
          status: ticketStatusFilter 
        }
      );

      setTickets(prevTickets => [...prevTickets, ...result.tickets]);
      setStartAt(newStartAt);
      setHasMore(result.tickets.length > 0 && (newStartAt + result.tickets.length) < result.total);
    } catch (err: any) {
      console.error('Error fetching more Jira tickets:', err);
      setError(err.message || 'Failed to fetch more Jira tickets');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch more Jira tickets',
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [credentials, selectedSprint, selectedProject, ticketTypeFilter, ticketStatusFilter, hasMore, startAt, loadingMore, toast]);

  // Content Generation
  const generateContent = useCallback(async (request: JiraGenerationRequest) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    setContentLoading(true);
    setError(null);

    try {
      if (!selectedTicket) {
        throw new Error('No ticket selected');
      }
      
      const response = await generateJiraContent(selectedTicket, request);
      setGeneratedContent(response);
      return response;
    } catch (err: any) {
      console.error('Error generating content:', err);
      setError(err.message || 'Failed to generate content');
      toast({
        title: "Error",
        description: err.message || 'Failed to generate content',
        variant: "destructive",
      });
    } finally {
      setContentLoading(false);
    }
  }, [credentials, selectedTicket, toast]);

  // Save Content to Database
  const saveContentToDatabase = useCallback(async (contentType: ContentType, content: string): Promise<boolean> => {
    if (!selectedTicket) {
      setError('No ticket selected');
      toast({
        title: "Error",
        description: "No ticket selected to save content for",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Prepare the data for saving
      const columnMapping: Record<ContentType, string> = {
        lld: 'lld_content',
        code: 'code_content',
        tests: 'test_content',
        testcases: 'testcases_content'
      };
      
      const column = columnMapping[contentType];
      
      // Check if there's already an entry for this ticket
      const { data: existingArtifact, error: fetchError } = await supabase
        .from('ticket_artifacts')
        .select('*')
        .eq('story_id', selectedTicket.key)
        .maybeSingle();
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      let result;
      
      if (existingArtifact) {
        // Update existing record
        const { data, error } = await supabase
          .from('ticket_artifacts')
          .update({ 
            [column]: content,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingArtifact.id)
          .select();
          
        if (error) throw new Error(error.message);
        result = data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('ticket_artifacts')
          .insert({ 
            story_id: selectedTicket.key, 
            project_id: selectedTicket.projectId || '', 
            sprint_id: selectedTicket.sprintId || '',
            [column]: content 
          })
          .select();
          
        if (error) throw new Error(error.message);
        result = data;
      }
      
      toast({
        title: "Content Saved",
        description: `${contentType.toUpperCase()} content has been saved to database`,
        variant: "success",
      });
      
      return true;
    } catch (err: any) {
      console.error('Error saving content to database:', err);
      setError(err.message || 'Failed to save content to database');
      toast({
        title: "Error",
        description: err.message || 'Failed to save content to database',
        variant: "destructive",
      });
      return false;
    }
  }, [selectedTicket, toast]);

  // Push to Jira
  const pushToJira = useCallback(async (ticketId: string, content: string): Promise<boolean> => {
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
  }, [credentials, toast]);

  // Utility function to refresh all data
  const refreshAll = useCallback(async () => {
    await fetchProjects();
    if (selectedProject) {
      await fetchSprints(selectedProject.id);
      if (selectedSprint) {
        await fetchTickets(selectedSprint.id);
      }
    }
  }, [fetchProjects, fetchSprints, selectedProject, selectedSprint, fetchTickets]);

  return {
    // Authentication
    credentials,
    isAuthenticated,
    error: error || authError,
    
    // Data
    projects,
    sprints,
    tickets,
    
    // Loading states
    loading: projectsLoading || sprintsLoading || ticketsLoading || contentLoading,
    projectsLoading,
    sprintsLoading,
    ticketsLoading,
    contentLoading,
    
    // Selection states
    selectedProject,
    selectedSprint,
    selectedTicket,
    
    // Filters
    ticketTypeFilter,
    ticketStatusFilter,
    searchTerm,
    
    // Extra data
    totalTickets,
    apiType,
    
    // Generated content
    generatedContent,
    
    // Actions
    setCredentials,
    setSelectedProject,
    setSelectedSprint,
    setSelectedTicket,
    setTicketTypeFilter,
    setTicketStatusFilter,
    setSearchTerm,
    setApiType,
    
    // API calls
    fetchProjects,
    fetchSprints,
    fetchTickets,
    fetchTicketsByProject,
    generateContent,
    pushToJira,
    saveContentToDatabase,
    
    // Utility
    refreshAll,
    fetchMoreTickets,
    hasMore,
    loadingMore
  };
};
