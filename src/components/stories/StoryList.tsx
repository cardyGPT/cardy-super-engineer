
import React, { useState, useEffect } from 'react';
import { useStories } from "@/contexts/StoriesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from "@/lib/supabase";
import { JiraTicket } from "@/types/jira";
import { 
  Search, 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Bug,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import LoadingContent from "./LoadingContent";

const PAGE_SIZE = 10;

const StoryList: React.FC = () => {
  const { 
    tickets, 
    ticketsLoading, 
    selectedTicket, 
    setSelectedTicket, 
    selectedSprint,
    ticketTypeFilter,
    searchTerm,
    setSearchTerm
  } = useStories();
  
  const [filteredTickets, setFilteredTickets] = useState<JiraTicket[]>(tickets);
  const [displayedTickets, setDisplayedTickets] = useState<JiraTicket[]>(tickets.slice(0, PAGE_SIZE));
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [ticketsWithArtifacts, setTicketsWithArtifacts] = useState<Set<string>>(new Set());
  
  // Get all tickets with artifacts
  useEffect(() => {
    const fetchTicketsWithArtifacts = async () => {
      try {
        const { data, error } = await supabase
          .from('story_artifacts')
          .select('story_id');
        
        if (error) {
          console.error("Error fetching artifacts:", error);
          return;
        }
        
        if (data) {
          const artifactKeys = new Set(data.map(item => item.story_id));
          setTicketsWithArtifacts(artifactKeys as Set<string>);
        }
      } catch (err) {
        console.error("Error fetching tickets with artifacts:", err);
      }
    };
    
    fetchTicketsWithArtifacts();
  }, []);
  
  // Filter tickets based on search term and ticket type filter
  useEffect(() => {
    let filtered = [...tickets];
    
    if (ticketTypeFilter) {
      filtered = filtered.filter(ticket => 
        ticket.issuetype?.name === ticketTypeFilter
      );
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.key?.toLowerCase().includes(term) || 
        ticket.summary?.toLowerCase().includes(term) ||
        ticket.description?.toLowerCase().includes(term) ||
        ticket.status?.toLowerCase().includes(term)
      );
    }
    
    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [tickets, searchTerm, ticketTypeFilter]);
  
  // Sort and paginate tickets
  useEffect(() => {
    if (!filteredTickets.length) {
      setDisplayedTickets([]);
      return;
    }
    
    const sorted = [...filteredTickets].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    const start = 0;
    const end = currentPage * PAGE_SIZE;
    setDisplayedTickets(sorted.slice(start, end));
  }, [filteredTickets, currentPage, sortDirection]);
  
  const handleSelectTicket = (ticket: JiraTicket) => {
    setSelectedTicket(ticket);
  };
  
  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };
  
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  // Loading state
  if (ticketsLoading && tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sprint Stories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <LoadingContent 
              count={4}
              message="Loading stories..."
            />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <CardTitle className="text-lg">Sprint Stories</CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleSortDirection} className="text-xs flex items-center">
            {sortDirection === 'desc' ? (
              <>Newest First <ArrowDown className="ml-1 h-3 w-3" /></>
            ) : (
              <>Oldest First <ArrowUp className="ml-1 h-3 w-3" /></>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {!selectedSprint ? (
            <div className="text-center p-4 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>Select a sprint to view stories</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No stories found in this sprint</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No stories match your filters</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {displayedTickets.map(ticket => (
                  <TicketListItem 
                    key={ticket.id}
                    ticket={ticket}
                    isSelected={selectedTicket?.id === ticket.id}
                    hasArtifacts={ticketsWithArtifacts.has(ticket.key)}
                    onClick={() => handleSelectTicket(ticket)}
                  />
                ))}
              </div>
              
              {displayedTickets.length < filteredTickets.length && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2" 
                  onClick={handleLoadMore}
                >
                  Load More
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component for rendering a ticket item
const TicketListItem: React.FC<{
  ticket: JiraTicket;
  isSelected: boolean;
  hasArtifacts: boolean;
  onClick: () => void;
}> = ({ ticket, isSelected, hasArtifacts, onClick }) => {
  return (
    <div 
      className={`p-2 rounded-md cursor-pointer flex items-start transition-colors ${
        isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
      }`}
      onClick={onClick}
    >
      <div className="mr-2 mt-0.5">
        <TicketStatusIcon status={ticket.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate flex items-center gap-1.5">
          {ticket.summary}
          {hasArtifacts && (
            <Sparkles className="h-3 w-3 text-amber-500 flex-shrink-0" />
          )}
        </div>
        <div className="text-xs mt-1 flex items-center gap-1.5">
          <span className="truncate">{ticket.key} • {ticket.status || 'Unknown Status'}</span>
          <TicketTypeLabel ticket={ticket} />
        </div>
      </div>
    </div>
  );
};

// Helper function for ticket status icon
const TicketStatusIcon: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return <Clock className="h-5 w-5 text-gray-400" />;
  
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('todo') || lowerStatus.includes('backlog') || lowerStatus.includes('open')) {
    return <Clock className="h-5 w-5 text-blue-500" />;
  } else if (lowerStatus.includes('progress') || lowerStatus.includes('doing')) {
    return <ArrowDown className="h-5 w-5 text-orange-500" />;
  } else if (lowerStatus.includes('review') || lowerStatus.includes('testing')) {
    return <AlertCircle className="h-5 w-5 text-purple-500" />;
  } else if (lowerStatus.includes('done') || lowerStatus.includes('closed') || lowerStatus.includes('complete')) {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  } else if (lowerStatus.includes('bug') || lowerStatus.includes('issue') || lowerStatus.includes('blocke')) {
    return <Bug className="h-5 w-5 text-red-500" />;
  }
  
  return <Clock className="h-5 w-5 text-gray-400" />;
};

// Helper function for ticket type label
const TicketTypeLabel: React.FC<{ ticket: JiraTicket }> = ({ ticket }) => {
  if (!ticket.issuetype?.name) return null;
  
  const type = ticket.issuetype.name;
  let color;
  
  if (type === 'Bug') {
    color = 'destructive';
  } else if (type === 'Story') {
    color = 'success';
  } else if (type === 'Task') {
    color = 'secondary';
  } else if (type === 'Sub-task') {
    color = 'default';
  } else {
    color = 'outline';
  }
  
  return (
    <Badge variant={color as any} className="text-[9px] px-1 py-0 h-4">
      {type}
    </Badge>
  );
};

export default StoryList;
