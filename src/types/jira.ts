
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
  fetchTickets: () => Promise<void>;
  selectedTicket: JiraTicket | null;
  setSelectedTicket: (ticket: JiraTicket | null) => void;
  generatedContent: JiraGenerationResponse | null;
  generateContent: (request: JiraGenerationRequest) => Promise<void>;
  pushToJira: (ticketId: string, content: string) => Promise<boolean>;
}
