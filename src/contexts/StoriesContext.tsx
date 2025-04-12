import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
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
  
  const projectsFetchingRef = useRef(false);
  const sprintsFetchingRef = useRef(false);
  const ticketsFetchingRef = useRef(false);
  
  const isAuthenticated = !!credentials;

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

  const fetchProjects = useCallback(async () => {
    if (!credentials) return;
    
    if (projectsFetchingRef.current) {
      console.log("Projects fetch already in progress, skipping");
      return;
    }
    
    setLoading(true);
    setError(null);
    projectsFetchingRef.current = true;
    
    try {
      console.log("Fetching active Jira projects...");
      
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'project',
          credentials,
          params: {
            expand: 'lead,description',
            status: 'active' // Only fetch active projects
          }
        }
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        console.log(`Received ${data.length} active projects from Jira`);
        
        const formattedProjects: JiraProject[] = data.map((project: any) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          avatarUrl: project.avatarUrls?.["48x48"] || '',
          domain: credentials.domain
        }));
        
        setProjects(formattedProjects);
        
        if (formattedProjects.length > 0 && !selectedProject) {
          setSelectedProject(formattedProjects[0]);
        }
      } else {
        console.log("No active projects found in Jira response");
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
      projectsFetchingRef.current = false;
    }
  }, [credentials, toast, selectedProject]);

  const fetchSprints = useCallback(async (projectId?: string) => {
    if (!credentials) return;
    if (!projectId && !selectedProject) return;
    
    const projectToUse = projectId || selectedProject?.id;
    if (!projectToUse) return;
    
    if (sprintsFetchingRef.current) {
      console.log("Sprints fetch already in progress, skipping");
      return;
    }
    
    setLoading(true);
    setError(null);
    sprintsFetchingRef.current = true;
    
    try {
      console.log(`Fetching boards for project ${projectToUse}...`);
      
      const { data: boardsData, error: boardsError } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'agile/1.0/board',
          credentials,
          params: {
            projectKeyOrId: projectToUse
          }
        }
      });
      
      if (boardsError) throw new Error(boardsError.message);
      
      if (!boardsData || !boardsData.values || boardsData.values.length === 0) {
        console.log("No boards found for this project");
        setSprints(prev => ({
          ...prev,
          [projectToUse]: []
        }));
        setSelectedSprint(null);
        setTickets([]);
        sprintsFetchingRef.current = false;
        setLoading(false);
        return;
      }
      
      const boardId = boardsData.values[0].id;
      console.log(`Found board with ID ${boardId} for project ${projectToUse}`);
      
      const { data: sprintsData, error: sprintsError } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: `agile/1.0/board/${boardId}/sprint`,
          credentials,
          params: {
            state: 'active,future' // Get both active and upcoming sprints
          }
        }
      });
      
      if (sprintsError) throw new Error(sprintsError.message);
      
      if (sprintsData && sprintsData.values && sprintsData.values.length > 0) {
        console.log(`Received ${sprintsData.values.length} sprints for board ${boardId}`);
        
        const formattedSprints: JiraSprint[] = sprintsData.values
          .map((sprint: any) => ({
            id: sprint.id,
            name: sprint.name,
            state: sprint.state,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            boardId: boardId
          }))
          .sort((a: JiraSprint, b: JiraSprint) => {
            if (a.state === 'active' && b.state !== 'active') return -1;
            if (a.state !== 'active' && b.state === 'active') return 1;
            
            if (a.startDate && b.startDate) {
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            }
            return 0;
          });
        
        setSprints(prev => ({
          ...prev,
          [projectToUse]: formattedSprints
        }));
        
        const activeSprints = formattedSprints.filter(s => s.state === 'active');
        if (activeSprints.length > 0 && (!selectedSprint || selectedSprint.id !== activeSprints[0].id)) {
          setSelectedSprint(activeSprints[0]);
        } else if (formattedSprints.length > 0 && !selectedSprint) {
          setSelectedSprint(formattedSprints[0]);
        } else if (formattedSprints.length === 0) {
          setSelectedSprint(null);
          setTickets([]);
        }
      } else {
        console.log("No sprints found for this board");
        setSprints(prev => ({
          ...prev,
          [projectToUse]: []
        }));
        setSelectedSprint(null);
        setTickets([]);
      }
    } catch (err: any) {
      console.error("Error fetching sprints:", err);
      setError(`Failed to fetch sprints: ${err.message}`);
      
      if (!err.message.includes('404')) {
        toast({
          title: "Error",
          description: `Failed to fetch sprints: ${err.message}`,
          variant: "destructive",
        });
      }
      
      setSprints(prev => ({
        ...prev,
        [projectToUse]: []
      }));
    } finally {
      setLoading(false);
      sprintsFetchingRef.current = false;
    }
  }, [credentials, selectedProject, selectedSprint, toast]);

  const fetchTickets = useCallback(async (sprintId?: string) => {
    if (!credentials) return;
    if (!sprintId && !selectedSprint) return;
    
    const sprintToUse = sprintId || selectedSprint?.id;
    if (!sprintToUse) return;
    
    if (ticketsFetchingRef.current) {
      console.log("Tickets fetch already in progress, skipping");
      return;
    }
    
    setLoading(true);
    setError(null);
    ticketsFetchingRef.current = true;
    
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
      
      setTickets([]);
    } finally {
      setLoading(false);
      ticketsFetchingRef.current = false;
    }
  }, [credentials, selectedSprint, toast]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isAuthenticated && projects.length === 0 && !projectsFetchingRef.current) {
      timeoutId = setTimeout(() => {
        fetchProjects();
      }, 500);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, fetchProjects, projects.length]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (selectedProject && !sprintsFetchingRef.current) {
      timeoutId = setTimeout(() => {
        fetchSprints(selectedProject.id);
      }, 500);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedProject, fetchSprints]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (selectedSprint && !ticketsFetchingRef.current) {
      timeoutId = setTimeout(() => {
        fetchTickets(selectedSprint.id);
      }, 500);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedSprint, fetchTickets]);

  const generateContent = async () => {
    console.log("generateContent will be implemented later");
  };

  const pushToJira = async () => {
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
