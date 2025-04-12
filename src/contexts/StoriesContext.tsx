
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
  
  // Use refs to track fetch states and prevent concurrent fetches
  const projectsFetchingRef = useRef(false);
  const sprintsFetchingRef = useRef(false);
  const ticketsFetchingRef = useRef(false);
  
  // Track last project and sprint IDs to prevent redundant fetches
  const lastProjectIdRef = useRef<string | null>(null);
  const lastSprintIdRef = useRef<string | null>(null);
  
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

    // Prevent duplicate fetch of the same project's sprints
    if (projectToUse === lastProjectIdRef.current && sprints[projectToUse]?.length > 0) {
      console.log(`Sprints for project ${projectToUse} already loaded, skipping fetch`);
      return;
    }
    
    // Update the last project ID ref
    lastProjectIdRef.current = projectToUse;
    
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
            projectKeyOrId: projectToUse,
            type: 'scrum' // Only get scrum boards, which support sprints
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
      
      // Find the first active scrum board
      const board = boardsData.values[0];
      const boardId = board.id;
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
      
      if (sprintsError && !sprintsError.message.includes('404')) {
        throw new Error(sprintsError.message);
      }
      
      // Handle case where no sprints found
      if (!sprintsData || !sprintsData.values) {
        console.log(`No sprints found for board ${boardId}`);
        setSprints(prev => ({
          ...prev,
          [projectToUse]: []
        }));
        setSelectedSprint(null);
        setTickets([]);
        return;
      }
      
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
      if (activeSprints.length > 0) {
        if (!selectedSprint || selectedSprint.id !== activeSprints[0].id) {
          setSelectedSprint(activeSprints[0]);
        }
      } else if (formattedSprints.length > 0 && !selectedSprint) {
        setSelectedSprint(formattedSprints[0]);
      } else if (formattedSprints.length === 0) {
        setSelectedSprint(null);
        setTickets([]);
      }
    } catch (err: any) {
      console.error("Error fetching sprints:", err);
      
      // Don't show toast for 404 errors, just log them
      if (!err.message.includes('404')) {
        setError(`Failed to fetch sprints: ${err.message}`);
        
        toast({
          title: "Error",
          description: `Failed to fetch sprints: ${err.message}`,
          variant: "destructive",
        });
      } else {
        console.log("No sprints found (404 error), setting empty sprints array");
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
    
    // Prevent duplicate fetch of the same sprint's tickets
    if (sprintToUse === lastSprintIdRef.current && tickets.length > 0) {
      console.log(`Tickets for sprint ${sprintToUse} already loaded, skipping fetch`);
      return;
    }
    
    // Update the last sprint ID ref
    lastSprintIdRef.current = sprintToUse;
    
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
  }, [credentials, selectedSprint, toast, tickets.length]);

  // Load projects only once on initial authentication
  useEffect(() => {
    let isMounted = true;
    
    if (isAuthenticated && projects.length === 0 && !projectsFetchingRef.current) {
      // Small delay to prevent race conditions
      const timeoutId = setTimeout(() => {
        if (isMounted) fetchProjects();
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
        isMounted = false;
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, fetchProjects, projects.length]);

  // Load sprints when project changes
  useEffect(() => {
    let isMounted = true;
    
    if (selectedProject && !sprintsFetchingRef.current) {
      // Small delay to allow UI to update first
      const timeoutId = setTimeout(() => {
        if (isMounted) fetchSprints(selectedProject.id);
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
        isMounted = false;
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [selectedProject, fetchSprints]);

  // Load tickets when sprint changes
  useEffect(() => {
    let isMounted = true;
    
    if (selectedSprint && !ticketsFetchingRef.current) {
      // Small delay to allow UI to update first
      const timeoutId = setTimeout(() => {
        if (isMounted) fetchTickets(selectedSprint.id);
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
        isMounted = false;
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [selectedSprint, fetchTickets]);

  // Handle changes in selected project by resetting sprint selection
  useEffect(() => {
    if (selectedProject) {
      const projectSprints = sprints[selectedProject.id] || [];
      // If we have sprints for this project but the selected sprint isn't among them,
      // select the first active sprint or the first sprint if no active ones
      if (projectSprints.length > 0) {
        const validSprint = selectedSprint && projectSprints.some(s => s.id === selectedSprint.id);
        if (!validSprint) {
          const activeSprintIndex = projectSprints.findIndex(s => s.state === 'active');
          setSelectedSprint(projectSprints[activeSprintIndex !== -1 ? activeSprintIndex : 0]);
        }
      }
    }
  }, [selectedProject, sprints, selectedSprint]);

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
