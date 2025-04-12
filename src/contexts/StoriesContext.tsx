
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { JiraCredentials, StoriesContextType, JiraTicket } from "@/types/jira";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const defaultContext: StoriesContextType = {
  credentials: null,
  setCredentials: () => {},
  isAuthenticated: false,
  tickets: [],
  loading: false,
  error: null,
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
      setSelectedTicket(null);
    }
  }, [credentials]);

  // Fetch tickets from Jira - optimized to reduce API calls
  const fetchTickets = useCallback(async () => {
    if (!credentials) return;
    
    // Don't fetch if already loading or if we already have tickets
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching Jira tickets...");
      
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'search',
          credentials,
          params: {
            jql: 'assignee = currentUser() OR reporter = currentUser() ORDER BY updated DESC',
            fields: 'summary,description,status,assignee,priority,labels,created,updated',
            maxResults: 50
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
  }, [credentials, toast]);

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
