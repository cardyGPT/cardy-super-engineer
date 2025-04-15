
import React, { useEffect, useRef, useCallback } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { JiraTicket } from '@/types/jira';
import { SearchIcon, List } from "lucide-react";
import LoadingContent from './LoadingContent';
import StoryHeader from './StoryHeader';
import { ScrollArea } from '@/components/ui/scroll-area';

const StoryList: React.FC = () => {
  const { 
    tickets, 
    ticketsLoading, 
    selectedTicket, 
    setSelectedTicket, 
    searchTerm, 
    setSearchTerm,
    ticketTypeFilter,
    fetchMoreTickets,
    hasMore,
    loadingMore
  } = useStories();
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter tickets by search term and type filter
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !ticketTypeFilter || 
      (ticket.issuetype?.name.toLowerCase() === ticketTypeFilter.toLowerCase());
    
    return matchesSearch && matchesType;
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
      rootMargin: '0px',
      threshold: 1.0
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

  return (
    <Card className="shadow-sm h-[calc(100vh-13rem)]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Tickets</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredTickets.length > 0 && `${filteredTickets.length} ${filteredTickets.length === 1 ? 'ticket' : 'tickets'}`}
          </div>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
