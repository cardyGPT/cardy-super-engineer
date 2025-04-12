
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
  
  // Track operation states to prevent setting state after component unmounts
  const isMountedRef = useRef(true);
  
  // Track initialization status
  const isInitializedRef = useRef(false);
  
  // Track empty results to avoid repeated fetches
  const emptySprintsProjectsRef = useRef<Set<string>>(new Set());
  const emptyTicketsSprintsRef = useRef<Set<string>>(new Set());
  
  const isAuthenticated = !!credentials;

  // Cleanup effect
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      // Clear caches
      emptySprintsProjectsRef.current.clear();
      emptyTicketsSprintsRef.current.clear();
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
      
      const { data, error: apiError } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'project',
          credentials,
          params: {
            expand: 'lead,description',
            status: 'active' // Only fetch active projects
          }
        }
      });
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
      if (apiError) throw new Error(apiError.message);
      
      if (data) {
        if (data.message) {
          // Server returned a message but no actual error - show as a toast notification
          toast({
            title: "Jira Projects",
            description: data.message
          });
        }
        
        console.log(`Received ${data.length} active projects from Jira`);
        
        const formattedProjects: JiraProject[] = data.map((project: any) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          avatarUrl: project.avatarUrls?.["48x48"] || '',
          domain: credentials.domain
        }));
        
        setProjects(formattedProjects);
        isInitializedRef.current = true;
        
        if (formattedProjects.length > 0 && !selectedProject) {
          setSelectedProject(formattedProjects[0]);
        }
      } else {
        console.log("No active projects found in Jira response");
        setProjects([]);
        isInitializedRef.current = true;
        toast({
          title: "No Projects",
          description: "No active projects were found in your Jira account.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
      console.error("Error fetching projects:", err);
      setError(`Failed to fetch projects: ${err.message}`);
      isInitializedRef.current = true;
      
      toast({
        title: "Error",
        description: `Failed to fetch projects: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      // Small delay before setting loading to false to prevent UI flicker
      setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(false);
          projectsFetchingRef.current = false;
        }
      }, 300);
    }
  }, [credentials, toast, selectedProject]);

  const fetchSprints = useCallback(async (projectId?: string) => {
    if (!credentials) return;
    if (!projectId && !selectedProject) return;
    
    const projectToUse = projectId || selectedProject?.id;
    if (!projectToUse) return;

    // Skip fetch if we already know this project has no sprints
    if (emptySprintsProjectsRef.current.has(projectToUse)) {
      console.log(`Project ${projectToUse} has no sprints (cached), skipping fetch`);
      return;
    }

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
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
      if (boardsError) throw new Error(boardsError.message);
      
      if (!boardsData || !boardsData.values || boardsData.values.length === 0) {
        console.log("No boards found for this project");
        setSprints(prev => ({
          ...prev,
          [projectToUse]: []
        }));
        // Remember this project has no sprints to avoid future requests
        emptySprintsProjectsRef.current.add(projectToUse);
        setSelectedSprint(null);
        setTickets([]);
        toast({
          title: "No Scrum Boards",
          description: boardsData?.message || "This project doesn't have any Scrum boards configured.",
          variant: "default"
        });
        setTimeout(() => {
          if (isMountedRef.current) {
            setLoading(false);
            sprintsFetchingRef.current = false;
          }
        }, 300);
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
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
      if (sprintsError && !sprintsError.message.includes('404')) {
        throw new Error(sprintsError.message);
      }
      
      // Handle case where no sprints found
      if (!sprintsData || !sprintsData.values || sprintsData.values.length === 0) {
        console.log(`No sprints found for board ${boardId}`);
        setSprints(prev => ({
          ...prev,
          [projectToUse]: []
        }));
        // Remember this project has no sprints to avoid future requests
        emptySprintsProjectsRef.current.add(projectToUse);
        setSelectedSprint(null);
        setTickets([]);
        toast({
          title: "No Sprints Found",
          description: sprintsData?.message || "No active or future sprints found for this board.",
          variant: "default"
        });
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
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
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
        toast({
          title: "No Sprints",
          description: "No sprints were found for this project.",
          variant: "default"
        });
      }
      
      setSprints(prev => ({
        ...prev,
        [projectToUse]: []
      }));
      
      // Remember this project has no sprints to avoid future requests
      emptySprintsProjectsRef.current.add(projectToUse);
      
      // Clear tickets when we can't get sprints
      setTickets([]);
    } finally {
      // Only update state if component is still mounted
      setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(false);
          sprintsFetchingRef.current = false;
        }
      }, 300);
    }
  }, [credentials, selectedProject, selectedSprint, toast]);

  const fetchTickets = useCallback(async (sprintId?: string) => {
    if (!credentials) return;
    if (!sprintId && !selectedSprint) return;
    
    const sprintToUse = sprintId || selectedSprint?.id;
    if (!sprintToUse) return;
    
    // Skip fetch if we already know this sprint has no tickets
    if (emptyTicketsSprintsRef.current.has(sprintToUse)) {
      console.log(`Sprint ${sprintToUse} has no tickets (cached), skipping fetch`);
      return;
    }
    
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
      
      const { data, error: apiError } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'search',
          credentials,
          params: {
            jql: `sprint = ${sprintToUse} ORDER BY updated DESC`,
            fields: 'summary,description,status,assignee,priority,labels,created,updated'
          }
        }
      });
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
      if (apiError) throw new Error(apiError.message);
      
      if (data && data.issues) {
        console.log(`Received ${data.issues.length} tickets from Jira`);
        
        if (data.issues.length === 0) {
          // Remember this sprint has no tickets to avoid future requests
          emptyTicketsSprintsRef.current.add(sprintToUse);
          
          // If we have a message from the server, show it
          if (data.message) {
            toast({
              title: "No Issues",
              description: data.message,
              variant: "default"
            });
          }
        }
        
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
        // Remember this sprint has no tickets to avoid future requests
        emptyTicketsSprintsRef.current.add(sprintToUse);
        
        // If we have a message from the server, show it
        if (data && data.message) {
          toast({
            title: "No Issues",
            description: data.message,
            variant: "default"
          });
        }
      }
    } catch (err: any) {
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
      console.error("Error fetching tickets:", err);
      setError(`Failed to fetch tickets: ${err.message}`);
      
      // Skip showing error for "Sprint does not exist" scenarios
      if (!err.message.includes("does not exist") && !err.message.includes("No permission")) {
        toast({
          title: "Error",
          description: `Failed to fetch tickets: ${err.message}`,
          variant: "destructive",
        });
      } else {
        console.log("Sprint issues: either not found or no permission");
        toast({
          title: "No Access",
          description: "Unable to access sprint details or tickets.",
          variant: "default"
        });
      }
      
      setTickets([]);
      // Remember this sprint has no tickets to avoid future requests
      emptyTicketsSprintsRef.current.add(sprintToUse);
    } finally {
      // Only update state if component is still mounted
      setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(false);
          ticketsFetchingRef.current = false;
        }
      }, 300);
    }
  }, [credentials, selectedSprint, toast, tickets.length]);

  // Reset cached empty results when credentials change
  useEffect(() => {
    emptySprintsProjectsRef.current.clear();
    emptyTicketsSprintsRef.current.clear();
  }, [credentials]);

  // Load projects only once on initial authentication
  useEffect(() => {
    if (isAuthenticated && !isInitializedRef.current && !projectsFetchingRef.current) {
      // Small delay to prevent race conditions
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) fetchProjects();
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    return () => {};
  }, [isAuthenticated, fetchProjects]);

  // Load sprints when project changes
  useEffect(() => {
    if (selectedProject && !sprintsFetchingRef.current) {
      // Skip fetch if we already know this project has no sprints
      if (emptySprintsProjectsRef.current.has(selectedProject.id)) {
        console.log(`Project ${selectedProject.id} has no sprints (cached), skipping fetch`);
        return;
      }
      
      // Small delay to allow UI to update first
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) fetchSprints(selectedProject.id);
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    return () => {};
  }, [selectedProject, fetchSprints]);

  // Load tickets when sprint changes
  useEffect(() => {
    if (selectedSprint && !ticketsFetchingRef.current) {
      // Skip fetch if we already know this sprint has no tickets
      if (emptyTicketsSprintsRef.current.has(selectedSprint.id)) {
        console.log(`Sprint ${selectedSprint.id} has no tickets (cached), skipping fetch`);
        return;
      }
      
      // Small delay to allow UI to update first
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) fetchTickets(selectedSprint.id);
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    return () => {};
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
          if (isMountedRef.current) {
            setSelectedSprint(projectSprints[activeSprintIndex !== -1 ? activeSprintIndex : 0]);
          }
        }
      } else if (isMountedRef.current && projectSprints.length === 0 && selectedSprint) {
        // Clear selected sprint if there are no sprints for the project
        setSelectedSprint(null);
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
