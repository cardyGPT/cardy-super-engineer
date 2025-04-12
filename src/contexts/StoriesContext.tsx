
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { JiraCredentials, StoriesContextType, JiraTicket, JiraProject, JiraSprint } from "@/types/jira";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const defaultContext: StoriesContextType = {
  credentials: null,
  setCredentials: () => {},
  isAuthenticated: false,
  tickets: [],
  loading: false,
  error: null,
  projects: [],
  sprints: {},
  selectedProject: null,
  setSelectedProject: () => {},
  selectedSprint: null,
  setSelectedSprint: () => {},
  fetchProjects: async () => {},
  fetchSprints: async () => {},
  fetchTickets: async () => {},
  selectedTicket: null,
  setSelectedTicket: () => {},
  generatedContent: null,
  generateContent: async () => {},
  pushToJira: async () => false
};

const StoriesContext = createContext<StoriesContextType>(defaultContext);

export const useStories = () => useContext(StoriesContext);

export const StoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(
    JSON.parse(localStorage.getItem("jira_credentials") || "null")
  );
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [sprints, setSprints] = useState<Record<string, JiraSprint[]>>({});
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const isAuthenticated = !!credentials;

  // Save credentials to localStorage whenever they change
  useEffect(() => {
    if (credentials) {
      localStorage.setItem("jira_credentials", JSON.stringify(credentials));
    } else {
      localStorage.removeItem("jira_credentials");
      setTickets([]);
      setProjects([]);
      setSprints({});
      setSelectedProject(null);
      setSelectedSprint(null);
      setSelectedTicket(null);
    }
  }, [credentials]);

  // Fetch projects from Jira
  const fetchProjects = useCallback(async () => {
    if (!credentials) return;
    
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching Jira projects...");
      
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'project',
          credentials
        }
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        console.log(`Received ${data.length} projects from Jira`);
        
        const formattedProjects: JiraProject[] = data.map((project: any) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          avatarUrl: project.avatarUrls?.["48x48"] || '',
          domain: credentials.domain
        }));
        
        setProjects(formattedProjects);
        
        // If projects are fetched and no project is selected, select the first one
        if (formattedProjects.length > 0 && !selectedProject) {
          setSelectedProject(formattedProjects[0]);
        }
      } else {
        console.log("No projects found in Jira response");
        setProjects([]);
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(`Failed to fetch projects: ${err.message}`);
      
      toast({
        title: "Error",
        description: `Failed to fetch projects: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [credentials, toast, loading, selectedProject]);

  // Fetch sprints for a project
  const fetchSprints = useCallback(async (projectId?: string) => {
    if (!credentials) return;
    if (!projectId && !selectedProject) return;
    
    const projectToUse = projectId || selectedProject?.id;
    if (!projectToUse) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching sprints for project ${projectToUse}...`);
      
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: `agile/1.0/board/project/${projectToUse}`,
          credentials,
        }
      });
      
      if (error) throw new Error(error.message);
      
      if (data && data.values && data.values.length > 0) {
        // Get the first board for the project
        const boardId = data.values[0].id;
        
        // Get sprints for this board
        const sprintsResponse = await supabase.functions.invoke('jira-api', {
          body: {
            endpoint: `agile/1.0/board/${boardId}/sprint`,
            credentials,
            params: {
              state: 'active,future'
            }
          }
        });
        
        if (sprintsResponse.error) throw new Error(sprintsResponse.error.message);
        
        if (sprintsResponse.data && sprintsResponse.data.values) {
          console.log(`Received ${sprintsResponse.data.values.length} sprints for project ${projectToUse}`);
          
          const formattedSprints: JiraSprint[] = sprintsResponse.data.values.map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: sprint.state,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            boardId: boardId
          }));
          
          setSprints(prev => ({
            ...prev,
            [projectToUse]: formattedSprints
          }));
          
          // If there are active sprints, select the first active one
          const activeSprints = formattedSprints.filter(s => s.state === 'active');
          if (activeSprints.length > 0 && (!selectedSprint || selectedSprint.id !== activeSprints[0].id)) {
            setSelectedSprint(activeSprints[0]);
          }
        } else {
          console.log("No sprints found for this project");
          setSprints(prev => ({
            ...prev,
            [projectToUse]: []
          }));
          setSelectedSprint(null);
        }
      } else {
        console.log("No boards found for this project");
        setSprints(prev => ({
          ...prev,
          [projectToUse]: []
        }));
        setSelectedSprint(null);
      }
    } catch (err: any) {
      console.error("Error fetching sprints:", err);
      setError(`Failed to fetch sprints: ${err.message}`);
      
      toast({
        title: "Error",
        description: `Failed to fetch sprints: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [credentials, selectedProject, toast]);

  // Fetch tickets from Jira for a specific sprint
  const fetchTickets = useCallback(async (sprintId?: string) => {
    if (!credentials) return;
    if (!sprintId && !selectedSprint) return;
    
    const sprintToUse = sprintId || selectedSprint?.id;
    if (!sprintToUse) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching tickets for sprint ${sprintToUse}...`);
      
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'search',
          credentials,
          params: {
            jql: `sprint = ${sprintToUse} ORDER BY updated DESC`,
            fields: 'summary,description,status,assignee,priority,labels,created,updated'
          }
        }
      });
      
      if (error) throw new Error(error.message);
      
      if (data && data.issues) {
        console.log(`Received ${data.issues.length} tickets from Jira`);
        
        const formattedTickets: JiraTicket[] = data.issues.map((issue: any) => ({
          id: issue.id,
          key: issue.key,
          summary: issue.fields?.summary || 'No summary',
          description: issue.fields?.description || '',
          status: issue.fields?.status?.name || '',
          assignee: issue.fields?.assignee?.displayName || '',
          priority: issue.fields?.priority?.name || '',
          labels: issue.fields?.labels || [],
          created_at: issue.fields?.created,
          updated_at: issue.fields?.updated,
          domain: credentials.domain
        }));
        
        setTickets(formattedTickets);
      } else {
        console.log("No tickets found in Jira response");
        setTickets([]);
      }
    } catch (err: any) {
      console.error("Error fetching tickets:", err);
      setError(`Failed to fetch tickets: ${err.message}`);
      
      toast({
        title: "Error",
        description: `Failed to fetch tickets: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [credentials, selectedSprint, toast]);

  // Effect to fetch projects when credentials change
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  // Effect to fetch sprints when selected project changes
  useEffect(() => {
    if (selectedProject) {
      fetchSprints(selectedProject.id);
    }
  }, [selectedProject, fetchSprints]);

  // Effect to fetch tickets when selected sprint changes
  useEffect(() => {
    if (selectedSprint) {
      fetchTickets(selectedSprint.id);
    }
  }, [selectedSprint, fetchTickets]);

  // Generate content using AI for a Jira ticket
  const generateContent = async () => {
    // This will be implemented in future updates
    console.log("generateContent will be implemented later");
  };

  const pushToJira = async () => {
    // This will be implemented in future updates
    console.log("pushToJira will be implemented later");
    return false;
  };

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
    pushToJira
  };

  return (
    <StoriesContext.Provider value={value}>
      {children}
    </StoriesContext.Provider>
  );
};
