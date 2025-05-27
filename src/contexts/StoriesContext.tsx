import React, { createContext, useContext, ReactNode } from 'react';
import { useStoriesState } from './stories/useStoriesState';
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, JiraGenerationRequest, JiraGenerationResponse, ContentType } from '@/types/jira';

// Type definitions for the context
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
  
  // API type
  apiType: 'agile' | 'classic' | 'cloud';
  
  // Generated content
  generatedContent: JiraGenerationResponse | null;
  
  // Total tickets
  totalTickets: number;
  
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

// Create context with undefined initial value
const StoriesContext = createContext<StoriesContextState | undefined>(undefined);

// Custom hook for accessing the context
export const useStories = () => {
  const context = useContext(StoriesContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
};

// Provider component
export const StoriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storiesState = useStoriesState();

  return (
    <StoriesContext.Provider value={storiesState}>
      {children}
    </StoriesContext.Provider>
  );
};

export default StoriesContext;
