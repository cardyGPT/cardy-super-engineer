
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
}

export interface JiraCredentials {
  domain: string;
  email: string;
  apiToken: string;
}

export interface JiraGenerationRequest {
  type: "lld" | "code" | "tests" | "all";
  jiraTicket: JiraTicket;
  dataModel?: any;
  documentsContext?: string;
}

export interface JiraGenerationResponse {
  lld?: string;
  code?: string;
  tests?: string;
  all?: string;
  response?: string;
  error?: string;
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
  generateContent: (request: JiraGenerationRequest) => Promise<void>;
  pushToJira: (ticketId: string, content: string) => Promise<boolean>;
}
