
import React, { createContext, useContext, useEffect, useState } from 'react';
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket } from '@/types/jira';
import { fetchJiraProjects, fetchJiraSprints, fetchJiraTickets } from '@/contexts/stories/api';

export type ContentType = 'lld' | 'code' | 'tests' | 'testcases';

export interface JiraContextData {
  credentials: JiraCredentials | null;
  setCredentials: (creds: JiraCredentials | null) => void;
  isAuthenticated: boolean;
  projects: JiraProject[];
  loadingProjects: boolean;
  selectedProject: JiraProject | null;
  setSelectedProject: (project: JiraProject | null) => void;
  sprints: JiraSprint[];
  loadingSprints: boolean;
  selectedSprint: JiraSprint | null;
  setSelectedSprint: (sprint: JiraSprint | null) => void;
  tickets: JiraTicket[];
  loadingTickets: boolean;
  selectedTicket: JiraTicket | null;
  setSelectedTicket: (ticket: JiraTicket | null) => void;
  contentType: ContentType;
  setContentType: (type: ContentType) => void;
  generatingContent: boolean;
  error: string | null;
}

const JiraContext = createContext<JiraContextData | undefined>(undefined);

export const useJira = () => {
  const context = useContext(JiraContext);
  if (!context) {
    throw new Error('useJira must be used within a JiraProvider');
  }
  return context;
};

export const JiraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);
  
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  
  const [contentType, setContentType] = useState<ContentType>('lld');
  const [generatingContent, setGeneratingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check local storage for saved credentials on initial load
  useEffect(() => {
    const savedCreds = localStorage.getItem('jira_credentials');
    if (savedCreds) {
      try {
        setCredentials(JSON.parse(savedCreds));
      } catch (err) {
        console.error('Failed to parse saved credentials:', err);
      }
    }
  }, []);
  
  // Load projects when credentials change
  useEffect(() => {
    if (credentials) {
      localStorage.setItem('jira_credentials', JSON.stringify(credentials));
      loadProjects();
    } else {
      localStorage.removeItem('jira_credentials');
      setProjects([]);
      setSprints([]);
      setTickets([]);
      setSelectedProject(null);
      setSelectedSprint(null);
      setSelectedTicket(null);
    }
  }, [credentials]);
  
  // Load sprints when selected project changes
  useEffect(() => {
    if (selectedProject && credentials) {
      loadSprints();
    } else {
      setSprints([]);
      setSelectedSprint(null);
    }
  }, [selectedProject]);
  
  // Load tickets when selected sprint changes
  useEffect(() => {
    if (selectedSprint && credentials) {
      loadTickets();
    } else {
      setTickets([]);
      setSelectedTicket(null);
    }
  }, [selectedSprint]);
  
  const loadProjects = async () => {
    if (!credentials) return;
    
    setLoadingProjects(true);
    setError(null);
    
    try {
      const loadedProjects = await fetchJiraProjects(credentials);
      setProjects(loadedProjects);
    } catch (err) {
      console.error('Failed to load projects:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load projects');
      }
    } finally {
      setLoadingProjects(false);
    }
  };
  
  const loadSprints = async () => {
    if (!credentials || !selectedProject) return;
    
    setLoadingSprints(true);
    setError(null);
    
    try {
      const loadedSprints = await fetchJiraSprints(credentials, selectedProject.id);
      setSprints(loadedSprints);
    } catch (err) {
      console.error('Failed to load sprints:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load sprints');
      }
    } finally {
      setLoadingSprints(false);
    }
  };
  
  const loadTickets = async () => {
    if (!credentials || !selectedSprint) return;
    
    setLoadingTickets(true);
    setError(null);
    
    try {
      const result = await fetchJiraTickets(
        credentials, 
        selectedSprint.id, 
        selectedProject, 
        0, 
        50, 
        { 
          type: null, 
          status: null 
        }
      );
      
      setTickets(result.tickets);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load tickets');
      }
    } finally {
      setLoadingTickets(false);
    }
  };
  
  const value = {
    credentials,
    setCredentials,
    isAuthenticated: !!credentials,
    projects,
    loadingProjects,
    selectedProject,
    setSelectedProject,
    sprints,
    loadingSprints,
    selectedSprint,
    setSelectedSprint,
    tickets,
    loadingTickets,
    selectedTicket, 
    setSelectedTicket,
    contentType,
    setContentType,
    generatingContent,
    error
  };
  
  return <JiraContext.Provider value={value}>{children}</JiraContext.Provider>;
};
