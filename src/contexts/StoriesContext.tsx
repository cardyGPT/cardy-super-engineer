
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

  // Fetch tickets from Jira
  const fetchTickets = async () => {
    if (!credentials) {
      setError("Not authenticated with Jira");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock API call for now - in a real app, we would call the Jira API
      // This would normally be via a Supabase Edge Function to keep credentials secure
      
      // Simulate API response
      setTimeout(() => {
        const mockTickets: JiraTicket[] = [
          {
            id: "1",
            key: "PROJ-123",
            summary: "Implement user authentication",
            description: "Create login and signup forms with email/password authentication",
            acceptance_criteria: "- User can sign up\n- User can log in\n- Password reset functionality works",
            status: "To Do",
            assignee: "John Doe",
            priority: "High",
            story_points: 5,
            labels: ["authentication", "frontend"],
            epic: "User Management",
            created_at: "2025-04-01T10:00:00Z",
            updated_at: "2025-04-10T14:30:00Z",
            domain: credentials.domain // Add domain from credentials
          },
          {
            id: "2",
            key: "PROJ-124",
            summary: "Implement data model for products",
            description: "Create database schema for products, categories, and inventory",
            acceptance_criteria: "- Product model has name, price, description\n- Products belong to categories\n- Inventory tracks stock levels",
            status: "In Progress",
            assignee: "Jane Smith",
            priority: "Medium",
            story_points: 3,
            labels: ["database", "backend"],
            epic: "Inventory Management",
            created_at: "2025-04-02T09:15:00Z",
            updated_at: "2025-04-11T11:45:00Z",
            domain: credentials.domain // Add domain from credentials
          },
          {
            id: "3",
            key: "PROJ-125",
            summary: "Create REST API for user profiles",
            description: "Implement CRUD operations for user profiles",
            acceptance_criteria: "- Get user profile\n- Update user profile\n- Delete user profile\n- List all users (admin only)",
            status: "To Do",
            assignee: "John Doe",
            priority: "Low",
            story_points: 2,
            labels: ["api", "backend"],
            epic: "User Management",
            created_at: "2025-04-03T14:20:00Z",
            updated_at: "2025-04-10T16:10:00Z",
            domain: credentials.domain // Add domain from credentials
          }
        ];
        
        setTickets(mockTickets);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError("Failed to fetch tickets");
      setLoading(false);
      console.error("Error fetching Jira tickets:", err);
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
      // Mock API call - in a real app, we would call the Jira API
      // This would normally be via a Supabase Edge Function
      
      // Simulate API response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
