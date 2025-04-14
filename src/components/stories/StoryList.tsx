
import React, { useEffect, useRef, useState } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JiraTicket } from '@/types/jira';
import { Search, Filter, X, Tag, ListFilter, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    totalTickets,
    ticketTypeFilter,
    setTicketTypeFilter,
    ticketStatusFilter,
    setTicketStatusFilter,
    fetchTickets
  } = useStories();
  
  const [filteredTickets, setFilteredTickets] = useState<JiraTicket[]>([]);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([]);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  // Extract unique types and statuses from tickets
  useEffect(() => {
    if (tickets.length > 0) {
      // Get unique issue types
      const types = tickets
        .map(ticket => ticket.issuetype?.name)
        .filter((type, index, self) => 
          type && self.indexOf(type) === index
        ) as string[];
      
      // Get unique statuses
      const statuses = tickets
        .map(ticket => ticket.status)
        .filter((status, index, self) => 
          status && self.indexOf(status) === index
        ) as string[];
      
      setUniqueTypes(types);
      setUniqueStatuses(statuses);
    }
  }, [tickets]);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loadingRef.current && hasMore) {
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !loadingMore && !ticketsLoading) {
          fetchMoreTickets();
        }
      }, { threshold: 0.3 });
      
      observer.current.observe(loadingRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, fetchMoreTickets, tickets.length, ticketsLoading]);
  
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
    
    // Apply type filter if selected
    if (ticketTypeFilter) {
      results = results.filter(ticket => 
        ticket.issuetype?.name === ticketTypeFilter
      );
    }
    
    // Apply status filter if selected
    if (ticketStatusFilter) {
      results = results.filter(ticket => 
        ticket.status === ticketStatusFilter
      );
    }
    
    setFilteredTickets(results);
  }, [tickets, searchTerm, ticketTypeFilter, ticketStatusFilter]);
  
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
  
  const handleTypeFilterChange = (value: string) => {
    setTicketTypeFilter(value === 'all' ? null : value);
  };
  
  const handleStatusFilterChange = (value: string) => {
    setTicketStatusFilter(value === 'all' ? null : value);
  };
  
  const clearFilters = () => {
    setTicketTypeFilter(null);
    setTicketStatusFilter(null);
    setSearchTerm('');
    setLocalSearchTerm('');
  };
  
  const handleRefreshTickets = async () => {
    if (!selectedProject) return;
    
    try {
      if (selectedSprint) {
        await fetchTickets(selectedSprint.id);
      }
    } catch (error) {
      console.error("Error refreshing tickets:", error);
    }
  };
  
  const filterCount = [
    ticketTypeFilter,
    ticketStatusFilter,
    searchTerm
  ].filter(Boolean).length;

  return (
    <Card className="h-[calc(100vh-16rem)]">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            Jira Tickets 
            {totalTickets > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                {filteredTickets.length > 0 ? `(${filteredTickets.length} of ${totalTickets})` : `(${totalTickets})`}
              </span>
            )}
          </CardTitle>
          
          <div className="flex space-x-2">
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="h-8"
            >
              <ListFilter className="h-4 w-4 mr-2" />
              Filters
              {filterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {filterCount}
                </Badge>
              )}
            </Button>
          </div>
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
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {showFilters && (
          <div className="mt-3 space-y-3 pt-3 border-t">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  <Tag className="h-3 w-3 inline mr-1" />
                  Issue Type
                </label>
                <Select
                  value={ticketTypeFilter || 'all'}
                  onValueChange={handleTypeFilterChange}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <Separator className="my-1" />
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  <Filter className="h-3 w-3 inline mr-1" />
                  Status
                </label>
                <Select
                  value={ticketStatusFilter || 'all'}
                  onValueChange={handleStatusFilterChange}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <Separator className="my-1" />
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {ticketsLoading ? (
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
              
              {hasMore && !ticketTypeFilter && !ticketStatusFilter && !searchTerm && (
                <div 
                  ref={loadingRef} 
                  className="py-2 text-center text-sm text-muted-foreground"
                >
                  {loadingMore ? (
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Loading more tickets...
                    </div>
                  ) : 'Scroll for more tickets'}
                </div>
              )}
              
              {!hasMore && tickets.length < totalTickets && (
                <div className="py-2 text-center text-sm text-muted-foreground">
                  Loaded {tickets.length} of {totalTickets} tickets
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            {selectedProject && selectedSprint ? (
              <>
                <div className="mb-4">No tickets found for this sprint with the current filters.</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshTickets}
                >
                  Refresh Tickets
                </Button>
              </>
            ) : selectedProject ? (
              <>
                <div className="mb-4">Please select a sprint to view tickets.</div>
              </>
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
      className={`p-2 mb-1 border rounded-md cursor-pointer transition-colors ${
        isSelected
          ? 'bg-primary/10 border-primary/50'
          : 'hover:bg-muted/50 border-transparent hover:border-muted'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div className="font-medium text-sm text-primary">{ticket.key}</div>
        <div className="flex items-center gap-1">
          {ticket.issuetype && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              {ticket.issuetype.name}
            </Badge>
          )}
          {ticket.status && (
            <Badge className={`text-xs ml-0.5 ${
              ticket.status.toLowerCase().includes('done') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
              ticket.status.toLowerCase().includes('progress') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
              ticket.status.toLowerCase().includes('review') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
              ticket.status.toLowerCase().includes('block') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {ticket.status}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="text-sm truncate mt-1">{ticket.summary}</div>
      
      {ticket.assignee && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-muted-foreground truncate max-w-[150px] flex items-center">
            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 20C4 17.3432 6.34325 14 12 14C17.6569 14 20 17.3432 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {ticket.assignee}
          </span>
        </div>
      )}
    </div>
  );
};

export default StoryList;
