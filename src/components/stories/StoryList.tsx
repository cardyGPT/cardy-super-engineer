
import React, { useState, useEffect } from 'react';
import { useStories } from "@/contexts/StoriesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bug, CheckCircle, Clock, Search, ArrowDown, ArrowUp, Sparkles, AlertTriangle } from "lucide-react";
import { JiraTicket } from "@/types/jira";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 10;

const StoryList: React.FC = () => {
  const { 
    tickets, 
    loading, 
    selectedTicket, 
    setSelectedTicket, 
    selectedSprint,
    ticketTypeFilter
  } = useStories();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTickets, setFilteredTickets] = useState<JiraTicket[]>([]);
  const [displayedTickets, setDisplayedTickets] = useState<JiraTicket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [ticketsWithArtifacts, setTicketsWithArtifacts] = useState<Set<string>>(new Set());
  
  // Fetch tickets that have artifacts
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
          setTicketsWithArtifacts(artifactKeys);
        }
      } catch (err) {
        console.error("Error in fetchTicketsWithArtifacts:", err);
      }
    };
    
    fetchTicketsWithArtifacts();
  }, []);
  
  // Filter tickets when search term changes, tickets list changes, or type filter changes
  useEffect(() => {
    if (!tickets) {
      setFilteredTickets([]);
      return;
    }
    
    let filtered = [...tickets];
    
    // Apply type filter if set
    if (ticketTypeFilter) {
      filtered = filtered.filter(ticket => 
        ticket.issuetype?.name === ticketTypeFilter
      );
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ticket => 
          ticket.key?.toLowerCase().includes(term) || 
          ticket.summary?.toLowerCase().includes(term) ||
          ticket.description?.toLowerCase().includes(term) ||
          ticket.status?.toLowerCase().includes(term)
      );
    }
    
    setFilteredTickets(filtered);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [tickets, searchTerm, ticketTypeFilter]);
  
  // Sort and paginate the filtered tickets
  useEffect(() => {
    if (!filteredTickets.length) {
      setDisplayedTickets([]);
      return;
    }
    
    // Sort tickets by created or updated date
    const sorted = [...filteredTickets].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    // Get current page of tickets
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    setDisplayedTickets(sorted.slice(0, end));
  }, [filteredTickets, currentPage, sortDirection]);
  
  const handleSelectTicket = (ticket: JiraTicket) => {
    setSelectedTicket(ticket);
  };
  
  const getTicketStatusIcon = (status?: string) => {
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
  
  const getTicketTypeLabel = (ticket: JiraTicket) => {
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
  
  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };
  
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  if (loading && (!tickets || tickets.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sprint Stories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
                  <div 
                    key={ticket.id}
                    className={`p-2 rounded-md cursor-pointer flex items-start transition-colors ${
                      selectedTicket?.id === ticket.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSelectTicket(ticket)}
                  >
                    <div className="mr-2 mt-0.5">
                      {getTicketStatusIcon(ticket.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-1.5">
                        {ticket.summary}
                        {ticketsWithArtifacts.has(ticket.key) && (
                          <Sparkles className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-1.5">
                        <span className="truncate">{ticket.key} • {ticket.status || 'Unknown Status'}</span>
                        {getTicketTypeLabel(ticket)}
                      </div>
                    </div>
                  </div>
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

export default StoryList;
