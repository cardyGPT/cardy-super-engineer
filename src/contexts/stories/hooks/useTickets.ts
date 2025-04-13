
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket } from '@/types/jira';
import { fetchJiraTickets } from '../api';

export const useTickets = (
  credentials: JiraCredentials | null,
  selectedProject: JiraProject | null,
  setError: (error: string | null) => void
) => {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null);
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string | null>(null);
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

    if (!selectedProject) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching tickets for sprint ID: ${sprintToUse} in project ID: ${selectedProject.id}`);
      const ticketsData = await fetchJiraTickets(credentials, sprintToUse, selectedProject);
      
      console.log(`Found ${ticketsData.length} tickets for sprint ID: ${sprintToUse}`);
      setTickets(ticketsData);
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
    } finally {
      setLoading(false);
    }
  };

  // Get filtered tickets
  const filteredTickets = ticketTypeFilter
    ? tickets.filter(ticket => ticket.issuetype?.name === ticketTypeFilter)
    : tickets;

  return {
    loading,
    tickets: filteredTickets,
    selectedTicket,
    setSelectedTicket,
    fetchTickets,
    ticketTypeFilter,
    setTicketTypeFilter
  };
};
