
import { useState, useCallback, useEffect } from 'react';
import { 
  JiraCredentials, 
  JiraGenerationRequest, 
  JiraGenerationResponse, 
  JiraProject, 
  JiraSprint, 
  JiraTicket
} from '@/types/jira';
import { 
  fetchJiraProjects, 
  fetchJiraSprints, 
  fetchJiraTickets, 
  fetchJiraTicketsByProject,
} from './api';
import { useAuthState } from './hooks/useAuthState';
import { useProjectsAndSprints } from './hooks/useProjectsAndSprints';
import { useTickets } from './hooks/useTickets';
import { useContentGeneration } from './hooks/useContentGeneration';
import { ContentType } from '@/components/stories/ContentDisplay';

export const useStoriesState = () => {
  const [error, setError] = useState<string | null>(null);
  
  // Auth state
  const { 
    credentials, 
    isAuthenticated, 
    setCredentials, 
    apiType, 
    setApiType 
  } = useAuthState();
  
  // Projects and sprints state
  const {
    projects,
    sprints,
    selectedProject,
    selectedSprint,
    projectsLoading,
    sprintsLoading,
    setSelectedProject,
    setSelectedSprint,
    fetchProjects,
    fetchSprints
  } = useProjectsAndSprints(credentials, apiType, setError);
  
  // Tickets state
  const {
    tickets,
    ticketsLoading,
    loadingMore,
    hasMore,
    totalTickets,
    selectedTicket,
    ticketTypeFilter,
    ticketStatusFilter,
    searchTerm,
    setSelectedTicket,
    setTicketTypeFilter,
    setTicketStatusFilter,
    setSearchTerm,
    fetchTickets,
    fetchTicketsByProject,
    fetchMoreTickets
  } = useTickets(credentials, apiType, setError);
  
  // Content generation state
  const {
    loading: contentLoading,
    isSaving,
    generatedContent,
    generateContent,
    saveContentToDatabase,
    saveAllContent,
    pushToJira
  } = useContentGeneration(credentials, selectedTicket, setError);
  
  // Refresh all data
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      await fetchProjects();
      
      if (selectedProject) {
        await fetchSprints(selectedProject.id);
        
        if (selectedSprint) {
          await fetchTickets(selectedSprint.id);
        } else {
          await fetchTicketsByProject(selectedProject.id);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while refreshing data');
      }
    }
  }, [
    isAuthenticated, 
    fetchProjects, 
    fetchSprints, 
    fetchTickets, 
    fetchTicketsByProject, 
    selectedProject, 
    selectedSprint
  ]);
  
  // Perform initial data fetching
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects().catch(err => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching projects');
        }
      });
    }
  }, [isAuthenticated, fetchProjects]);
  
  // Fetch sprints when project changes
  useEffect(() => {
    if (selectedProject) {
      setSelectedSprint(null);
      fetchSprints(selectedProject.id).catch(err => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching sprints');
        }
      });
    }
  }, [selectedProject, fetchSprints, setSelectedSprint]);
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  return {
    // Auth state
    credentials,
    isAuthenticated,
    setCredentials,
    apiType,
    setApiType,
    
    // Data state
    projects,
    sprints,
    tickets,
    error,
    totalTickets,
    
    // Loading state
    loading: projectsLoading || sprintsLoading || ticketsLoading || contentLoading,
    projectsLoading,
    sprintsLoading,
    ticketsLoading,
    contentLoading,
    loadingMore,
    hasMore,
    
    // Selection state
    selectedProject,
    selectedSprint,
    selectedTicket,
    
    // Filter state
    ticketTypeFilter,
    ticketStatusFilter,
    searchTerm,
    
    // Generated content
    generatedContent,
    
    // Actions
    setSelectedProject,
    setSelectedSprint,
    setSelectedTicket,
    setTicketTypeFilter,
    setTicketStatusFilter,
    setSearchTerm,
    
    // API calls
    fetchProjects,
    fetchSprints,
    fetchTickets,
    fetchTicketsByProject,
    generateContent,
    pushToJira,
    saveContentToDatabase,
    saveAllContent,
    
    // Utility
    refreshAll,
    fetchMoreTickets
  };
};

export type StoriesContextState = ReturnType<typeof useStoriesState>;
