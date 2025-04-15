
import React, { useEffect, useRef, useCallback } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { JiraTicket } from '@/types/jira';
import { SearchIcon, List, Filter } from "lucide-react";
import LoadingContent from './LoadingContent';
import StoryHeader from './StoryHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const StoryList: React.FC = () => {
  const { 
    tickets, 
    ticketsLoading, 
    selectedTicket, 
    setSelectedTicket, 
    searchTerm, 
    setSearchTerm,
    ticketTypeFilter,
    setTicketTypeFilter,
    ticketStatusFilter,
    setTicketStatusFilter,
    fetchMoreTickets,
    hasMore,
    loadingMore,
    totalTickets
  } = useStories();
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Get unique ticket types and statuses for filters
  const ticketTypes = React.useMemo(() => {
    const types = new Set<string>();
    tickets.forEach(ticket => {
      if (ticket.issuetype?.name) {
        types.add(ticket.issuetype.name);
      }
    });
    return Array.from(types).sort();
  }, [tickets]);

  const ticketStatuses = React.useMemo(() => {
    const statuses = new Set<string>();
    tickets.forEach(ticket => {
      if (ticket.status) {
        statuses.add(ticket.status);
      }
    });
    return Array.from(statuses).sort();
  }, [tickets]);

  // Filter tickets by search term and type filter
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !ticketTypeFilter || 
      (ticket.issuetype?.name.toLowerCase() === ticketTypeFilter.toLowerCase());
    
    const matchesStatus = !ticketStatusFilter || 
      (ticket.status?.toLowerCase() === ticketStatusFilter.toLowerCase());
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Setup intersection observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loadingMore && !ticketsLoading) {
      fetchMoreTickets();
    }
  }, [hasMore, loadingMore, ticketsLoading, fetchMoreTickets]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    });
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  // Calculate the display count message
  const getCountMessage = () => {
    if (filteredTickets.length === 0) return '';
    
    if (searchTerm || ticketTypeFilter || ticketStatusFilter) {
      return `${filteredTickets.length} filtered ${filteredTickets.length === 1 ? 'ticket' : 'tickets'}`;
    }
    
    // If we're showing all tickets without filters
    if (totalTickets && totalTickets > tickets.length) {
      return `${tickets.length} of ${totalTickets} ${totalTickets === 1 ? 'ticket' : 'tickets'}`;
    }
    
    return `${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}`;
  };

  // Clear all filters
  const clearFilters = () => {
    setTicketTypeFilter(null);
    setTicketStatusFilter(null);
    setSearchTerm('');
  };

  return (
    <Card className="shadow-sm h-[calc(100vh-13rem)]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Tickets</CardTitle>
          <div className="text-sm text-muted-foreground">
            {getCountMessage()}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Tickets</h4>
                <Separator />
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Type</h5>
                  <Select
                    value={ticketTypeFilter || ""}
                    onValueChange={(value) => setTicketTypeFilter(value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {ticketTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Status</h5>
                  <Select
                    value={ticketStatusFilter || ""}
                    onValueChange={(value) => setTicketStatusFilter(value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {ticketStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between pt-2">
                  <div className="flex flex-wrap gap-1">
                    {ticketTypeFilter && (
                      <Badge variant="outline" className="gap-1">
                        {ticketTypeFilter}
                        <button 
                          className="ml-1 hover:text-destructive" 
                          onClick={() => setTicketTypeFilter(null)}
                        >×</button>
                      </Badge>
                    )}
                    {ticketStatusFilter && (
                      <Badge variant="outline" className="gap-1">
                        {ticketStatusFilter}
                        <button 
                          className="ml-1 hover:text-destructive" 
                          onClick={() => setTicketStatusFilter(null)}
                        >×</button>
                      </Badge>
                    )}
                  </div>
                  {(ticketTypeFilter || ticketStatusFilter || searchTerm) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-18rem)]">
          {ticketsLoading && filteredTickets.length === 0 ? (
            <LoadingContent 
              count={5}
              isLoading={true}
              message="Loading tickets..."
            />
          ) : filteredTickets.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <List className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No tickets found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {ticketTypeFilter 
                  ? `No ${ticketTypeFilter} tickets found. Try changing the filter.` 
                  : ticketStatusFilter
                    ? `No tickets with status "${ticketStatusFilter}" found. Try changing the filter.`
                    : searchTerm 
                      ? 'Try a different search term.' 
                      : 'Select a project and sprint to load tickets.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedTicket?.id === ticket.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <StoryHeader ticket={ticket} />
                </div>
              ))}
              
              {/* Loading indicator for infinite scroll */}
              <div ref={observerTarget} className="h-16 flex justify-center items-center">
                {loadingMore && (
                  <div className="text-sm text-muted-foreground animate-pulse">
                    Loading more tickets...
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StoryList;
