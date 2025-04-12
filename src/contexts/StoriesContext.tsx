import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { JiraCredentials, StoriesContextType, JiraTicket, JiraProject, JiraSprint, JiraGenerationRequest, JiraGenerationResponse } from "@/types/jira";
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
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast();
  
  const projectsFetchingRef = useRef(false);
  const sprintsFetchingRef = useRef(false);
  const ticketsFetchingRef = useRef(false);
  
  const lastProjectIdRef = useRef<string | null>(null);
  const lastSprintIdRef = useRef<string | null>(null);
  
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);
  
  const emptySprintsProjectsRef = useRef<Set<string>>(new Set());
  const emptyTicketsSprintsRef = useRef<Set<string>>(new Set());
  
  const isAuthenticated = !!credentials;

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
            status: 'active'
          }
        }
      });
      
      if (!isMountedRef.current) return;
      
      if (apiError) throw new Error(apiError.message);
      
      if (data) {
        if (data.message) {
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

    if (emptySprintsProjectsRef.current.has(projectToUse)) {
      console.log(`Project ${projectToUse} has no sprints (cached), skipping fetch`);
      return;
    }

    if (projectToUse === lastProjectIdRef.current && sprints[projectToUse]?.length > 0) {
      console.log(`Sprints for project ${projectToUse} already loaded, skipping fetch`);
      return;
    }
    
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
            type: 'scrum'
          }
        }
      });
      
      if (!isMountedRef.current) return;
      
      if (boardsError) throw new Error(boardsError.message);
      
      if (!boardsData || !boardsData.values || boardsData.values.length === 0) {
        console.log("No boards found for this project");
        setSprints(prev => ({
          ...prev,
          [projectToUse]: []
        }));
        emptySprintsProjectsRef.current.add(projectToUse);
        setSelectedSprint(null);
        setTickets([]);
        toast({
          title: "No Scrum Boards",
          description: boardsData?.message || "This project doesn't have any Scrum boards configured.",
          variant: "default"
        });
        return;
      }
      
      const board = boardsData.values[0];
      const boardId = board.id;
      console.log(`Found board with ID ${boardId} for project ${projectToUse}`);
      
      const { data: sprintsData, error: sprintsError } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: `agile/1.0/board/${boardId}/sprint`,
          credentials,
          params: {
            state: 'active,future'
          }
        }
      });
      
      if (!isMountedRef.current) return;
      
      if (sprintsError && !sprintsError.message.includes('404')) {
        throw new Error(sprintsError.message);
      }
      
      if (!sprintsData || !sprintsData.values || sprintsData.values.length === 0) {
        console.log(`No sprints found for board ${boardId}`);
        setSprints(prev => ({
          ...prev,
          [projectToUse]: []
        }));
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
      if (!isMountedRef.current) return;
      
      console.error("Error fetching sprints:", err);
      
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
      
      emptySprintsProjectsRef.current.add(projectToUse);
      
      setTickets([]);
    } finally {
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
    
    if (emptyTicketsSprintsRef.current.has(sprintToUse)) {
      console.log(`Sprint ${sprintToUse} has no tickets (cached), skipping fetch`);
      return;
    }
    
    if (sprintToUse === lastSprintIdRef.current && tickets.length > 0) {
      console.log(`Tickets for sprint ${sprintToUse} already loaded, skipping fetch`);
      return;
    }
    
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
      
      if (!isMountedRef.current) return;
      
      if (apiError) throw new Error(apiError.message);
      
      if (data && data.issues) {
        console.log(`Received ${data.issues.length} tickets from Jira`);
        
        if (data.issues.length === 0) {
          emptyTicketsSprintsRef.current.add(sprintToUse);
          
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
          domain: credentials.domain,
          projectId: selectedProject?.id || null,
          sprintId: sprintToUse
        }));
        
        setTickets(formattedTickets);
      } else {
        console.log("No tickets found in Jira response");
        setTickets([]);
        emptyTicketsSprintsRef.current.add(sprintToUse);
        
        if (data && data.message) {
          toast({
            title: "No Issues",
            description: data.message,
            variant: "default"
          });
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      
      console.error("Error fetching tickets:", err);
      
      setError(`Failed to fetch tickets: ${err.message}`);
      
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
      emptyTicketsSprintsRef.current.add(sprintToUse);
    } finally {
      setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(false);
          ticketsFetchingRef.current = false;
        }
      }, 300);
    }
  }, [credentials, selectedSprint, toast, tickets.length, selectedProject]);

  useEffect(() => {
    emptySprintsProjectsRef.current.clear();
    emptyTicketsSprintsRef.current.clear();
  }, [credentials]);

  useEffect(() => {
    if (isAuthenticated && !isInitializedRef.current && !projectsFetchingRef.current) {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) fetchProjects();
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    return () => {};
  }, [isAuthenticated, fetchProjects]);

  useEffect(() => {
    if (selectedProject && !sprintsFetchingRef.current) {
      if (emptySprintsProjectsRef.current.has(selectedProject.id)) {
        console.log(`Project ${selectedProject.id} has no sprints (cached), skipping fetch`);
        return;
      }
      
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) fetchSprints(selectedProject.id);
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    return () => {};
  }, [selectedProject, fetchSprints]);

  useEffect(() => {
    if (selectedSprint && !ticketsFetchingRef.current) {
      if (emptyTicketsSprintsRef.current.has(selectedSprint.id)) {
        console.log(`Sprint ${selectedSprint.id} has no tickets (cached), skipping fetch`);
        return;
      }
      
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) fetchTickets(selectedSprint.id);
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    return () => {};
  }, [selectedSprint, fetchTickets]);

  useEffect(() => {
    if (selectedProject) {
      const projectSprints = sprints[selectedProject.id] || [];
      if (projectSprints.length > 0) {
        const validSprint = selectedSprint && projectSprints.some(s => s.id === selectedSprint.id);
        if (!validSprint) {
          const activeSprintIndex = projectSprints.findIndex(s => s.state === 'active');
          if (isMountedRef.current) {
            setSelectedSprint(projectSprints[activeSprintIndex !== -1 ? activeSprintIndex : 0]);
          }
        }
      } else if (isMountedRef.current && projectSprints.length === 0 && selectedSprint) {
        setSelectedSprint(null);
      }
    }
  }, [selectedProject, sprints, selectedSprint]);

  const safeStringify = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    
    if (content && typeof content === 'object') {
      try {
        return JSON.stringify(content);
      } catch (e) {
        console.error("Error stringifying content:", e);
        return "[Content conversion error]";
      }
    }
    
    return String(content || "");
  };

  const generateContent = useCallback(async (request: JiraGenerationRequest) => {
    if (!credentials || isGenerating) return;
    
    setIsGenerating(true);
    setGeneratedContent(null);
    setLoading(true);
    
    try {
      console.log(`Generating ${request.type} content for ticket ${request.jiraTicket.key}...`);
      
      const { data, error: apiError } = await supabase.functions.invoke('chat-with-jira', {
        body: {
          jiraTicket: request.jiraTicket,
          dataModel: request.dataModel,
          documentsContext: request.documentsContext,
          request: request.type === 'lld' ? 'Generate a Low-Level Design document' : 
                  request.type === 'code' ? 'Generate implementation code' :
                  request.type === 'tests' ? 'Generate test cases' : 
                  'Generate a Low-Level Design document, implementation code, and test cases'
        }
      });
      
      if (apiError) throw new Error(apiError.message);
      
      if (data) {
        console.log("Content generation successful");
        
        let responseStr = typeof data.response === 'string' ? 
          data.response : safeStringify(data.response);
        
        const response: JiraGenerationResponse = {
          response: responseStr,
          [request.type]: responseStr
        };
        
        setGeneratedContent(response);
        
        toast({
          title: "Content Generated",
          description: `Successfully generated ${request.type === 'all' ? 'all content' : request.type} for ${request.jiraTicket.key}`,
        });
      }
    } catch (err: any) {
      console.error("Error generating content:", err);
      
      setGeneratedContent({
        error: `Failed to generate content: ${err.message}`
      });
      
      toast({
        title: "Generation Error",
        description: `Failed to generate content: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  }, [credentials, toast, isGenerating]);

  const pushToJira = useCallback(async (ticketId: string, content: string): Promise<boolean> => {
    if (!credentials) return false;
    
    try {
      console.log(`Pushing content to Jira ticket ${ticketId}...`);
      
      const safeContent = typeof content === 'string' ? content : safeStringify(content);
      
      const { data, error: apiError } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: `issue/${ticketId}/comment`,
          method: 'POST',
          credentials,
          data: {
            body: safeContent
          }
        }
      });
      
      if (apiError) throw new Error(apiError.message);
      
      console.log("Content successfully pushed to Jira");
      return true;
    } catch (err: any) {
      console.error("Error pushing to Jira:", err);
      
      toast({
        title: "Error",
        description: `Failed to push content to Jira: ${err.message}`,
        variant: "destructive",
      });
      
      return false;
    }
  }, [credentials, toast]);

  const value = {
    credentials,
    setCredentials,
    isAuthenticated,
    tickets,
    loading: loading || isGenerating,
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
