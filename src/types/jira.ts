
export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  acceptance_criteria?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  story_points?: number;
  labels?: string[];
  epic?: string;
  created_at?: string;
  updated_at?: string;
  domain?: string;
  projectId?: string;
  sprintId?: string;
  issuetype?: {
    id: string;
    name: string;
  };
  sprintInfo?: any;
  epicInfo?: any;
  isLoadingAdditionalInfo?: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrl?: string;
  domain?: string;
}

export interface JiraSprint {
  id: string;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  boardId: string;
  projectId?: string;
  totalIssues?: number;
}

export interface JiraCredentials {
  domain: string;
  email: string;
  apiToken: string;
}

export interface JiraGenerationRequest {
  type: 'lld' | 'code' | 'tests' | 'testcases' | 'testScripts';
  jiraTicket: JiraTicket;
  projectContext?: string;
  selectedDocuments?: string[];
  additionalContext?: any;
}

export interface JiraGenerationResponse {
  lld?: string;
  lldContent?: string;
  code?: string;
  codeContent?: string;
  tests?: string;
  testContent?: string;
  testCasesContent?: string;
  testScriptsContent?: string;
}

export interface ProjectContextData {
  project: {
    id: string;
    name: string;
    type: string;
  };
  documents: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface StoriesContextType {
  credentials: JiraCredentials | null;
  setCredentials: (creds: JiraCredentials | null) => void;
  isAuthenticated: boolean;
  tickets: JiraTicket[];
  loading: boolean;
  error: string | null;
  projects: JiraProject[];
  sprints: Record<string, JiraSprint[]>;
  selectedProject: JiraProject | null;
  setSelectedProject: (project: JiraProject | null) => void;
  selectedSprint: JiraSprint | null;
  setSelectedSprint: (sprint: JiraSprint | null) => void;
  fetchProjects: () => Promise<void>;
  fetchSprints: (projectId?: string) => Promise<void>;
  fetchTickets: (sprintId?: string) => Promise<void>;
  selectedTicket: JiraTicket | null;
  setSelectedTicket: (ticket: JiraTicket | null) => void;
  generatedContent: JiraGenerationResponse | null;
  generateContent: (request: JiraGenerationRequest) => Promise<JiraGenerationResponse | void>;
  pushToJira: (ticketId: string, content: string) => Promise<boolean>;
  ticketTypeFilter: string | null;
  setTicketTypeFilter: (type: string | null) => void;
  ticketStatusFilter: string | null;
  setTicketStatusFilter: (status: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  fetchMoreTickets: () => Promise<void>;
  projectsLoading: boolean;
  sprintsLoading: boolean;
  ticketsLoading: boolean;
  contentLoading: boolean;
  fetchTicketsByProject: (projectId: string) => Promise<void>;
}
