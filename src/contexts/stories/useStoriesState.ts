
import { useState, useEffect } from 'react';
import { StoriesContextState, StoriesContextActions } from './types';
import { useAuthState } from './hooks/useAuthState';
import { useProjectsAndSprints } from './hooks/useProjectsAndSprints';
import { useTickets } from './hooks/useTickets';
import { useContentGeneration } from './hooks/useContentGeneration';

export const useStoriesState = (): StoriesContextState & StoriesContextActions => {
  const [error, setError] = useState<string | null>(null);
  
  // Use the extracted hooks
  const { credentials, setCredentials, isAuthenticated } = useAuthState();
  
  const { 
    loading: projectsLoading, 
    projects, 
    sprints, 
    selectedProject, 
    setSelectedProject, 
    selectedSprint, 
    setSelectedSprint,
    fetchProjects,
    fetchSprints 
  } = useProjectsAndSprints(credentials, setError);
  
  const { 
    loading: ticketsLoading, 
    tickets, 
    selectedTicket, 
    setSelectedTicket, 
    fetchTickets,
    ticketTypeFilter,
    setTicketTypeFilter 
  } = useTickets(credentials, selectedProject, setError);
  
  const { 
    loading: contentLoading, 
    generatedContent, 
    generateContent, 
    pushToJira 
  } = useContentGeneration(credentials, selectedTicket, setError);

  // Combined loading state
  const loading = projectsLoading || ticketsLoading || contentLoading;

  // Reset affected states when selectedSprint changes
  useEffect(() => {
    if (selectedSprint) {
      setSelectedTicket(null);
      
      // Fetch tickets for the selected sprint
      fetchTickets(selectedSprint.id);
    } else {
      // Clear tickets when no sprint is selected
      setSelectedTicket(null);
    }
  }, [selectedSprint]);

  // Load projects when credentials are set
  useEffect(() => {
    if (credentials) {
      fetchProjects();
    }
  }, [credentials]);

  return {
    credentials,
    setCredentials,
    isAuthenticated,
    tickets,
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
