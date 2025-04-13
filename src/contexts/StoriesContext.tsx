
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  JiraCredentials, 
  JiraProject, 
  JiraSprint, 
  JiraTicket, 
  JiraGenerationRequest, 
  JiraGenerationResponse,
  StoriesContextType
} from '@/types/jira';
import { useToast } from '@/hooks/use-toast';

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export const StoriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [sprints, setSprints] = useState<Record<string, JiraSprint[]>>({});
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse | null>(null);
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize credentials from local storage
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        // Check for credentials stored in localStorage first (for backward compatibility)
        const storedCreds = localStorage.getItem('jira_credentials');
        if (storedCreds) {
          const parsedCreds = JSON.parse(storedCreds);
          if (parsedCreds) {
            const jiraCreds: JiraCredentials = {
              domain: parsedCreds.url || parsedCreds.domain || '',
              email: parsedCreds.email || '',
              apiToken: parsedCreds.token || parsedCreds.apiToken || ''
            };
            
            console.log("Found credentials in localStorage");
            setCredentials(jiraCreds);
            setIsAuthenticated(true);
            return;
          }
        }

        // Then try to get from database
        try {
          const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('service', 'jira')
            .maybeSingle();
          
          if (error) {
            console.error("Error loading Jira credentials:", error);
            return;
          }
          
          if (data) {
            const creds: JiraCredentials = {
              domain: data.domain || '',
              email: data.username || '',
              apiToken: data.api_key || ''
            };
            
            setCredentials(creds);
            setIsAuthenticated(true);
          }
        } catch (dbErr) {
          console.error("Error in database credentials lookup:", dbErr);
        }
      } catch (err) {
        console.error("Error in loadCredentials:", err);
      }
    };
    
    loadCredentials();
  }, []);

  // Effect to save credentials to database when they change
  useEffect(() => {
    const saveCredentialsToDb = async () => {
      if (!credentials) return;
      
      try {
        // Save to Supabase
        const { error } = await supabase
          .from('api_keys')
          .upsert({
            service: 'jira',
            domain: credentials.domain,
            username: credentials.email,
            api_key: credentials.apiToken
          }, { onConflict: 'service' });
          
        if (error) {
          console.error("Error saving Jira credentials to database:", error);
          // Also save to localStorage as fallback
          localStorage.setItem('jira_credentials', JSON.stringify({
            url: credentials.domain,
            email: credentials.email,
            token: credentials.apiToken
          }));
        }
      } catch (err) {
        console.error("Error saving credentials:", err);
        // Save to localStorage as fallback
        localStorage.setItem('jira_credentials', JSON.stringify({
          url: credentials.domain,
          email: credentials.email,
          token: credentials.apiToken
        }));
      }
    };
    
    if (credentials) {
      saveCredentialsToDb();
    }
  }, [credentials]);

  const fetchProjects = async () => {
    if (!credentials) {
      setError('Authentication required');
      toast({
        title: "Authentication Required",
        description: "Please connect to Jira first",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          action: 'get-projects',
          credentials
        }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to connect to Jira API");
      }
      
      if (data?.error) {
        throw new Error(data.error || "Jira API returned an error");
      }
      
      if (data?.projects) {
        setProjects(data.projects);
        setIsAuthenticated(true);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to fetch projects');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch projects',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSprints = async (projectId?: string) => {
    if (!credentials) {
      setError('Authentication required');
      return;
    }
    
    const targetProjectId = projectId || selectedProject?.id;
    if (!targetProjectId) {
      setError('No project selected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          action: 'get-sprints',
          credentials,
          projectId: targetProjectId
        }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to connect to Jira API");
      }
      
      if (data?.error) {
        throw new Error(data.error || "Jira API returned an error");
      }
      
      if (data?.sprints) {
        setSprints(prev => ({
          ...prev,
          [targetProjectId]: data.sprints
        }));
      } else {
        setSprints(prev => ({
          ...prev,
          [targetProjectId]: []
        }));
      }
    } catch (err: any) {
      console.error('Error fetching sprints:', err);
      setError(err.message || 'Failed to fetch sprints');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch sprints',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (sprintId?: string) => {
    if (!credentials) {
      setError('Authentication required');
      return;
    }
    
    const targetSprintId = sprintId || selectedSprint?.id;
    if (!targetSprintId) {
      setError('No sprint selected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          action: 'get-tickets',
          credentials,
          sprintId: targetSprintId
        }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to connect to Jira API");
      }
      
      if (data?.error) {
        throw new Error(data.error || "Jira API returned an error");
      }
      
      if (data?.tickets) {
        const ticketsWithProjectSprint = data.tickets.map((ticket: JiraTicket) => ({
          ...ticket,
          projectId: selectedProject?.id,
          sprintId: targetSprintId
        }));
        setTickets(ticketsWithProjectSprint);
      } else {
        setTickets([]);
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Failed to fetch tickets');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch tickets',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (request: JiraGenerationRequest): Promise<JiraGenerationResponse | void> => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-with-jira', {
        body: {
          jiraTicket: request.jiraTicket,
          dataModel: request.dataModel,
          documentsContext: request.documentsContext,
          request: `Generate ${request.type === 'lld' ? 'Low-Level Design' : request.type === 'code' ? 'Implementation Code' : 'Test Cases'}`
        }
      });
      
      if (error) throw new Error(error.message);
      
      const response: JiraGenerationResponse = {
        response: data.response
      };
      
      if (request.type === 'lld') {
        response.lld = data.response;
      } else if (request.type === 'code') {
        response.code = data.response;
      } else if (request.type === 'tests') {
        response.tests = data.response;
      }
      
      setGeneratedContent(response);
      return response;
    } catch (err: any) {
      console.error('Error generating content:', err);
      setError(err.message || 'Failed to generate content');
      toast({
        title: "Error",
        description: err.message || 'Failed to generate content',
        variant: "destructive"
      });
      throw err;
    }
  };

  const pushToJira = async (ticketId: string, content: string): Promise<boolean> => {
    if (!credentials) {
      setError('Authentication required');
      return false;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          action: 'add-comment',
          credentials,
          ticketId,
          comment: content
        }
      });
      
      if (error) throw new Error(error.message);
      
      return true;
    } catch (err: any) {
      console.error('Error pushing to Jira:', err);
      setError(err.message || 'Failed to push content to Jira');
      toast({
        title: "Error",
        description: err.message || 'Failed to push content to Jira',
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (isAuthenticated && credentials) {
      fetchProjects();
    }
  }, [isAuthenticated, credentials]);

  const value = {
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

  return (
    <StoriesContext.Provider value={value}>
      {children}
    </StoriesContext.Provider>
  );
};

export const useStories = () => {
  const context = useContext(StoriesContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
};
