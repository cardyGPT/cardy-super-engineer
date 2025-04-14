
import React, { useEffect, useRef, useState } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { JiraTicket } from '@/types/jira';
import { Search, Filter } from "lucide-react";

const StoryList: React.FC = () => {
  const { 
    tickets, 
    ticketsLoading, 
    selectedTicket, 
    setSelectedTicket, 
    searchTerm, 
    setSearchTerm,
    hasMore,
    loadingMore,
    fetchMoreTickets,
    selectedProject,
    selectedSprint,
    totalTickets
  } = useStories();
  
  const [filteredTickets, setFilteredTickets] = useState<JiraTicket[]>([]);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const scrollRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loadingRef.current && hasMore) {
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          fetchMoreTickets();
        }
      }, { threshold: 0.5 });
      
      observer.current.observe(loadingRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, fetchMoreTickets, tickets.length]);
  
  // Update localSearchTerm when searchTerm changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);
  
  // Apply search term and filtering to tickets
  useEffect(() => {
    let results = [...tickets];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(ticket => 
        ticket.key.toLowerCase().includes(term) || 
        ticket.summary.toLowerCase().includes(term)
      );
    }
    
    setFilteredTickets(results);
  }, [tickets, searchTerm]);
  
  const handleSearch = () => {
    setSearchTerm(localSearchTerm);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
    if (e.target.value === '') {
      setSearchTerm('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="h-[calc(100vh-16rem)]">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            Jira Tickets 
            {filteredTickets.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({filteredTickets.length} {totalTickets > filteredTickets.length ? `of ${totalTickets}` : ''})
              </span>
            )}
          </CardTitle>
        </div>
        
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={localSearchTerm}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
              className="pl-8"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleSearch}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {ticketsLoading && filteredTickets.length === 0 ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredTickets.length > 0 ? (
          <ScrollArea ref={scrollRef} className="h-[calc(100vh-20rem)]">
            <div className="p-1">
              {filteredTickets.map((ticket) => (
                <StoryListItem
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={selectedTicket?.id === ticket.id}
                  onSelect={() => setSelectedTicket(ticket)}
                />
              ))}
              
              {hasMore && (
                <div 
                  ref={loadingRef} 
                  className="py-4 text-center text-sm text-muted-foreground"
                >
                  {loadingMore ? 'Loading more tickets...' : 'Scroll for more tickets'}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {selectedProject && selectedSprint ? (
              <>No tickets found for this sprint.</>
            ) : selectedProject ? (
              <>Please select a sprint.</>
            ) : (
              <>Please select a project.</>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface StoryListItemProps {
  ticket: JiraTicket;
  isSelected: boolean;
  onSelect: () => void;
}

const StoryListItem: React.FC<StoryListItemProps> = ({ ticket, isSelected, onSelect }) => {
  return (
    <div
      className={`p-3 mb-1 border rounded-md cursor-pointer transition-colors ${
        isSelected
          ? 'bg-primary/10 border-primary/50'
          : 'hover:bg-muted/50 border-transparent hover:border-muted'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="font-medium text-sm text-primary">{ticket.key}</div>
        {ticket.issuetype?.name && (
          <Badge variant="outline" className="text-xs">
            {ticket.issuetype.name}
          </Badge>
        )}
      </div>
      <div className="text-sm truncate">{ticket.summary}</div>
      <div className="flex justify-between items-center mt-2">
        {ticket.status && (
          <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            {ticket.status}
          </Badge>
        )}
        {ticket.assignee && (
          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
            {ticket.assignee}
          </span>
        )}
      </div>
    </div>
  );
};

export default StoryList;
