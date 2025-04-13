
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';

export interface StoriesContextState {
  credentials: JiraCredentials | null;
  isAuthenticated: boolean;
  tickets: JiraTicket[];
  loading: boolean;
  error: string | null;
  projects: JiraProject[];
  sprints: Record<string, JiraSprint[]>;
  selectedProject: JiraProject | null;
  selectedSprint: JiraSprint | null;
  selectedTicket: JiraTicket | null;
  generatedContent: JiraGenerationResponse | null;
  ticketTypeFilter: string | null;
}

export interface StoriesContextActions {
  setCredentials: (creds: JiraCredentials | null) => void;
  setSelectedProject: (project: JiraProject | null) => void;
  setSelectedSprint: (sprint: JiraSprint | null) => void;
  setSelectedTicket: (ticket: JiraTicket | null) => void;
  setTicketTypeFilter: (type: string | null) => void;
  fetchProjects: () => Promise<void>;
  fetchSprints: (projectId?: string) => Promise<void>;
  fetchTickets: (sprintId?: string) => Promise<void>;
  generateContent: (request: JiraGenerationRequest) => Promise<JiraGenerationResponse | void>;
  pushToJira: (ticketId: string, content: string) => Promise<boolean>;
}

export type StoriesContextType = StoriesContextState & StoriesContextActions;
