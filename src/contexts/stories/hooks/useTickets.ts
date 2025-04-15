
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket } from '@/types/jira';
import { fetchJiraTickets, fetchJiraTicketsByProject } from '../api';

export const useTickets = (
  credentials: JiraCredentials | null,
  apiType: 'agile' | 'classic' | 'cloud',
  setError: (error: string | null) => void
) => {
  const [loading, setLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string | null>(null);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hasMore, setHasMore] = useState(false);
  const [totalTickets, setTotalTickets] = useState(0);
  const { toast } = useToast();

  const fetchTickets = async (sprintId?: string) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    const sprintToUse = sprintId || null;

    if (!sprintToUse) {
      setError('No sprint selected');
      return;
    }
    
    setTicketsLoading(true);
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching tickets for sprint ID: ${sprintToUse}`);
      const result = await fetchJiraTickets(
        credentials, 
        sprintToUse, 
        null, // Will need to get the selected project from the parent component
        0, 
        50, 
        { 
          type: ticketTypeFilter, 
          status: ticketStatusFilter 
        }
      );
      
      console.log(`Found ${result.tickets.length} tickets for sprint ID: ${sprintToUse}`);
      setTickets(result.tickets);
      setTotalTickets(result.total);
      setHasMore(result.tickets.length < result.total);
    } catch (err: any) {
      console.error('Error fetching Jira tickets:', err);
      setError(err.message || 'Failed to fetch Jira tickets');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira tickets',
        variant: "destructive",
      });
      // Ensure tickets is at least an empty array on error
      setTickets([]);
      setTotalTickets(0);
      setHasMore(false);
    } finally {
      setTicketsLoading(false);
      setLoading(false);
    }
  };

  const fetchTicketsByProject = async (projectId: string) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    if (!projectId) {
      setError('No project ID provided');
      return;
    }

    setTicketsLoading(true);
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching tickets for project ID: ${projectId}`);
      
      // Get the project object first - we'll need to pass this to the API
      // In a real implementation, you'd get this from your project state
      const projectObj: JiraProject = {
        id: projectId,
        key: "", // This would come from your project data
        name: "" // This would come from your project data
      };
      
      const result = await fetchJiraTicketsByProject(
        credentials,
        projectObj,
        0,
        50,
        {
          type: ticketTypeFilter,
          status: ticketStatusFilter
        }
      );
      
      console.log(`Found ${result.tickets.length} tickets for project ID: ${projectId}`);
      setTickets(result.tickets);
      setTotalTickets(result.total);
      setHasMore(result.tickets.length < result.total);
    } catch (err: any) {
      console.error('Error fetching Jira tickets by project:', err);
      setError(err.message || 'Failed to fetch Jira tickets by project');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira tickets by project',
        variant: "destructive",
      });
      setTickets([]);
      setTotalTickets(0);
      setHasMore(false);
    } finally {
      setTicketsLoading(false);
      setLoading(false);
    }
  };

  const fetchMoreTickets = async () => {
    if (!credentials || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      console.log(`Fetching more tickets, starting from ${tickets.length}`);
      // Implement pagination logic here
      // This is a placeholder implementation
      // You would need to implement the actual API call
      
      setLoadingMore(false);
      // After fetching more tickets, append them to the existing list
      // Update hasMore flag based on whether there are more tickets to load
    } catch (err: any) {
      console.error('Error fetching more Jira tickets:', err);
      setError(err.message || 'Failed to fetch more Jira tickets');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch more Jira tickets',
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    loading,
    ticketsLoading,
    loadingMore,
    hasMore,
    tickets,
    totalTickets,
    selectedTicket,
    setSelectedTicket,
    fetchTickets,
    fetchTicketsByProject,
    fetchMoreTickets,
    ticketTypeFilter,
    setTicketTypeFilter,
    ticketStatusFilter,
    setTicketStatusFilter,
    searchTerm,
    setSearchTerm
  };
};
