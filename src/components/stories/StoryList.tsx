
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";
import { useStories } from '@/contexts/StoriesContext';
import { JiraTicket } from '@/types/jira';
import LoadingContent from './LoadingContent';
import { supabase } from '@/lib/supabase';

const StoryList: React.FC = () => {
  const { 
    tickets, 
    selectedTicket, 
    setSelectedTicket, 
    ticketsLoading, 
    error,
    ticketTypeFilter,
    searchTerm,
    setSearchTerm
  } = useStories();
  
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [generatedTicketIds, setGeneratedTicketIds] = useState<Set<string>>(new Set());
  
  // Load the list of story IDs that have generated content
  useEffect(() => {
    const fetchGeneratedStoriesIds = async () => {
      try {
        const { data, error } = await supabase
          .from('story_artifacts')
          .select('story_id');
        
        if (error) {
          console.error('Error fetching generated story IDs:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const ids = new Set(data.map(item => item.story_id));
          setGeneratedTicketIds(ids);
        }
      } catch (err) {
        console.error('Error in fetchGeneratedStoriesIds:', err);
      }
    };
    
    fetchGeneratedStoriesIds();
  }, []);
  
  // Reset selection when tickets change
  useEffect(() => {
    setSelectedTicketIds(new Set<string>());
  }, [tickets]);
  
  // Apply filters
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Apply type filter
      if (ticketTypeFilter && ticket.issuetype?.name !== ticketTypeFilter) {
        return false;
      }
      
      // Apply search filter
      if (searchTerm && !ticket.summary.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [tickets, ticketTypeFilter, searchTerm]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleTicketClick = (ticket: JiraTicket) => {
    setSelectedTicket(ticket);
    
    // Toggle selection
    const newSelectedIds = new Set(selectedTicketIds);
    if (newSelectedIds.has(ticket.id)) {
      newSelectedIds.delete(ticket.id);
    } else {
      newSelectedIds.add(ticket.id);
    }
    setSelectedTicketIds(newSelectedIds);
  };
  
  const getTicketTypeColor = (type: string | undefined) => {
    switch(type?.toLowerCase()) {
      case 'story':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'bug':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'task':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sub-task':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Stories</span>
          {filteredTickets.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {filteredTickets.length} 
              {ticketTypeFilter ? ` ${ticketTypeFilter}` : ' tickets'}
            </Badge>
          )}
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stories..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {ticketsLoading ? (
          <div className="p-4">
            <LoadingContent message="Loading stories..." />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <p>{error}</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {tickets.length === 0 ? (
              <p>No stories available in this sprint.</p>
            ) : (
              <p>No stories match your filters.</p>
            )}
          </div>
        ) : (
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {filteredTickets.map((ticket: JiraTicket) => (
              <div
                key={ticket.id}
                className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-muted/50 border-l-4 border-primary' : ''
                }`}
                onClick={() => handleTicketClick(ticket)}
              >
                <div className="flex justify-between mb-1">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-muted-foreground mr-2">
                      {ticket.key}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getTicketTypeColor(ticket.issuetype?.name)}`}
                    >
                      {ticket.issuetype?.name || 'Unknown'}
                    </Badge>
                  </div>
                  
                  {generatedTicketIds.has(ticket.id) && (
                    <Badge 
                      variant="outline" 
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    >
                      Generated
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-sm font-medium line-clamp-2">
                  {ticket.summary}
                </h3>
                
                <div className="flex mt-2 gap-2">
                  {ticket.priority && (
                    <Badge variant="outline" className="text-xs">
                      P: {ticket.priority}
                    </Badge>
                  )}
                  
                  {ticket.status && (
                    <Badge variant="outline" className="text-xs">
                      {ticket.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoryList;
