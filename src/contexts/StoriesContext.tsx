
import React, { createContext, useState, useContext } from "react";
import { supabase } from "@/lib/supabase";
import {
  JiraTicket,
  JiraCredentials,
  JiraGenerationRequest,
  JiraGenerationResponse,
  StoriesContextType
} from "@/types/jira";
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse | null>(null);
  const { toast } = useToast();

  const isAuthenticated = !!credentials;

  // Save credentials to localStorage whenever they change
  React.useEffect(() => {
    if (credentials) {
      localStorage.setItem("jira_credentials", JSON.stringify(credentials));
    } else {
      localStorage.removeItem("jira_credentials");
    }
  }, [credentials]);

  // Validate Jira credentials
  const validateCredentials = async (): Promise<boolean> => {
    if (!credentials) return false;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'myself',
          credentials
        }
      });
      
      if (error || !data || data.error) {
        console.error("Jira credential validation error:", error || data?.error);
        setError(error?.message || data?.error || "Failed to validate Jira credentials");
        setLoading(false);
        return false;
      }
      
      console.log("Jira credentials validated successfully");
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error validating Jira credentials:", err);
      setError("Failed to validate Jira credentials");
      setLoading(false);
      return false;
    }
  };

  // Fetch tickets from Jira
  const fetchTickets = async () => {
    if (!credentials) {
      setError("Not authenticated with Jira");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Make a JQL search request to Jira
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'search',
          method: 'POST',
          credentials,
          data: {
            jql: "project in (issuekey) ORDER BY updated DESC",
            maxResults: 20,
            fields: [
              "summary",
              "description",
              "status",
              "priority",
              "assignee",
              "labels",
              "customfield_10016", // Story points - may vary depending on Jira configuration
              "customfield_10014", // Epic link - may vary depending on Jira configuration
              "created",
              "updated"
            ]
          }
        }
      });
      
      if (error || data.error) {
        throw new Error(error?.message || data.error || "Failed to fetch tickets");
      }
      
      // Transform Jira API response to our JiraTicket format
      const jiraTickets: JiraTicket[] = data.issues.map((issue: any) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description || "",
        status: issue.fields.status?.name,
        assignee: issue.fields.assignee?.displayName,
        priority: issue.fields.priority?.name,
        story_points: issue.fields.customfield_10016,
        labels: issue.fields.labels,
        epic: issue.fields.customfield_10014,
        created_at: issue.fields.created,
        updated_at: issue.fields.updated,
        domain: credentials.domain
      }));
      
      setTickets(jiraTickets);
      setLoading(false);
      
      toast({
        title: "Success",
        description: `Fetched ${jiraTickets.length} tickets from Jira`,
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch tickets");
      setLoading(false);
      console.error("Error fetching Jira tickets:", err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to fetch tickets from Jira",
        variant: "destructive",
      });
    }
  };

  // Generate content based on the selected ticket and data model
  const generateContent = async (request: JiraGenerationRequest) => {
    setLoading(true);
    setError(null);
    setGeneratedContent(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-with-jira', {
        body: {
          jiraTicket: request.jiraTicket,
          dataModel: request.dataModel,
          documentsContext: request.documentsContext,
          request: `Generate ${request.type === 'all' ? 'a complete solution including LLD, code, and tests' : request.type} for this Jira ticket.`
        }
      });
      
      if (error) {
        throw error;
      }
      
      setGeneratedContent({
        response: data.response,
        [request.type]: data.response
      });
      
      toast({
        title: "Content Generated",
        description: `Successfully generated ${request.type === 'all' ? 'content' : request.type} for ticket ${request.jiraTicket.key}`,
      });
    } catch (err: any) {
      console.error("Error generating content:", err);
      setError(err.message || "Failed to generate content");
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Push generated content back to Jira
  const pushToJira = async (ticketId: string, content: string): Promise<boolean> => {
    if (!credentials) {
      setError("Not authenticated with Jira");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Add comment to Jira ticket
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: `issue/${ticketId}/comment`,
          method: 'POST',
          credentials,
          data: {
            body: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Generated content from Cardy Project Compass:\n\n"
                    }
                  ]
                },
                {
                  type: "codeBlock",
                  attrs: { language: "none" },
                  content: [
                    {
                      type: "text",
                      text: content
                    }
                  ]
                }
              ]
            }
          }
        }
      });
      
      if (error || data.error) {
        throw new Error(error?.message || data.error || "Failed to push to Jira");
      }
      
      toast({
        title: "Content Pushed",
        description: `Successfully updated Jira ticket ${ticketId}`,
      });
      
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Error pushing to Jira:", err);
      setError(err.message || "Failed to push to Jira");
      setLoading(false);
      
      toast({
        title: "Error",
        description: "Failed to push content to Jira. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
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
