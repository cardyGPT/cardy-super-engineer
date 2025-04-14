
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStoriesState } from './stories/useStoriesState';
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';

// Interface for the context state
interface StoriesContextProps {
  // Authentication state
  credentials: JiraCredentials | null;
  setCredentials: (creds: JiraCredentials | null) => void;
  isAuthenticated: boolean;
  error: string | null;
  
  // API type
  apiType: 'agile' | 'classic' | 'cloud';
  setApiType: (type: 'agile' | 'classic' | 'cloud') => void;
  
  // Data state
  projects: JiraProject[];
  sprints: Record<string, JiraSprint[]>;
  tickets: JiraTicket[];
  
  // Project pagination
  hasMoreProjects: boolean;
  isLoadingMoreProjects: boolean;
  fetchMoreProjects: () => Promise<void>;
  
  // Ticket pagination
  totalTickets: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  loadingMore: boolean;
  fetchMoreTickets: () => Promise<void>;
  
  // Loading states
  loading: boolean;
  projectsLoading: boolean;
  sprintsLoading: boolean;
  ticketsLoading: boolean;
  contentLoading: boolean;
  
  // Selection states
  selectedProject: JiraProject | null;
  setSelectedProject: (project: JiraProject | null) => void;
  selectedSprint: JiraSprint | null;
  setSelectedSprint: (sprint: JiraSprint | null) => void;
  selectedTicket: JiraTicket | null;
  setSelectedTicket: (ticket: JiraTicket | null) => void;
  
  // Filter states
  ticketTypeFilter: string | null;
  setTicketTypeFilter: (type: string | null) => void;
  ticketStatusFilter: string | null;
  setTicketStatusFilter: (status: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // API methods
  fetchProjects: () => Promise<void>;
  fetchSprints: (projectId: string) => Promise<void>;
  fetchTickets: (sprintId: string) => Promise<void>;
  fetchTicketsByProject: (projectId: string) => Promise<void>;
  generateContent: (request: JiraGenerationRequest) => Promise<JiraGenerationResponse | void>;
  pushToJira: (ticketId: string, content: string) => Promise<boolean>;
  refreshAll: () => Promise<void>;
}

// Create the context
const StoriesContext = createContext<StoriesContextProps | undefined>(undefined);

// Provider component
export const StoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiType, setApiType] = useState<'agile' | 'classic' | 'cloud'>(() => {
    // Try to load from localStorage on initialization
    try {
      const savedType = localStorage.getItem('jira_api_type');
      if (savedType === 'agile' || savedType === 'classic' || savedType === 'cloud') {
        return savedType;
      }
      return 'agile'; // Default
    } catch (err) {
      return 'agile';
    }
  });
  
  // Save API type to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('jira_api_type', apiType);
    } catch (e) {
      console.error('Failed to save API type to localStorage:', e);
    }
  }, [apiType]);
  
  // Create the stories state with the API type
  const storiesState = useStoriesState(apiType);
  
  // Provide combined context
  const contextValue = {
    ...storiesState,
    apiType,
    setApiType
  };
  
  return (
    <StoriesContext.Provider value={contextValue}>
      {children}
    </StoriesContext.Provider>
  );
};

// Custom hook to use the context
export const useStories = () => {
  const context = useContext(StoriesContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
};
