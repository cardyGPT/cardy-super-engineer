import React, { useState } from 'react';
import { useStories } from '@/contexts/stories';
import { JiraTicket } from '@/types/jira';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const StoryList: React.FC = () => {
  const { 
    tickets, 
    selectedTicket, 
    setSelectedTicket, 
    loading, 
    loadingMore,
    hasMore,
    ticketTypeFilter, 
    setTicketTypeFilter,
    ticketStatusFilter,
    setTicketStatusFilter,
    searchTerm,
    setSearchTerm,
    fetchMoreTickets
  } = useStories();
  
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const handleTicketClick = (ticket: JiraTicket) => {
    setSelectedTicket(ticket);
  };
  
  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || isFetchingMore) return;
    
    setIsFetchingMore(true);
    try {
      await fetchMoreTickets();
    } finally {
      setIsFetchingMore(false);
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    status = (status || '').toLowerCase();
    
    switch (status) {
      case 'open':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'in progress':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'closed':
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case 'done':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case 'resolved':
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };
  
  const getTypeBadgeColor = (type: string) => {
    type = (type || '').toLowerCase();
    
    switch (type) {
      case 'story':
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case 'task':
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      case 'bug':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case 'epic':
        return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search Tickets</Label>
          <Input 
            id="search" 
            placeholder="Search by ticket key or summary..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type-filter">Filter by Type</Label>
            <Select value={ticketTypeFilter || ''} onValueChange={setTicketTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="Story">Story</SelectItem>
                <SelectItem value="Task">Task</SelectItem>
                <SelectItem value="Bug">Bug</SelectItem>
                <SelectItem value="Epic">Epic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status-filter">Filter by Status</Label>
            <Select value={ticketStatusFilter || ''} onValueChange={setTicketStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ScrollArea className="h-[450px] w-full rounded-md border">
          <div className="p-2 space-y-2">
            {tickets.map((ticket) => (
              <Button
                key={ticket.id}
                variant="ghost"
                className={`w-full justify-start rounded-md hover:bg-secondary ${selectedTicket?.id === ticket.id ? 'bg-secondary text-secondary-foreground' : 'text-foreground'}`}
                onClick={() => handleTicketClick(ticket)}
                disabled={loading}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {selectedTicket?.id === ticket.id ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 mr-2 text-muted-foreground" />
                    )}
                    <span>{ticket.key}: {ticket.summary}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {ticket.issuetype?.name && (
                      <Badge className={getTypeBadgeColor(ticket.issuetype.name)}>
                        {ticket.issuetype.name}
                      </Badge>
                    )}
                    {ticket.status && (
                      <Badge className={getStatusBadgeColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
            ))}
            
            {hasMore && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLoadMore}
                disabled={loadingMore || isFetchingMore}
              >
                {loadingMore || isFetchingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StoryList;
