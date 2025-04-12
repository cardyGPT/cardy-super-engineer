
import React, { useEffect } from "react";
import { useStories } from "@/contexts/StoriesContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { RefreshCw, ExternalLink } from "lucide-react";

const StoryList: React.FC = () => {
  const { tickets, loading, error, fetchTickets, setSelectedTicket, selectedTicket } = useStories();

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Create a proper click handler that doesn't pass parameters
  const handleRefreshClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    fetchTickets();
  };

  // Create a proper retry handler
  const handleRetryClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    fetchTickets();
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Jira Tickets</h2>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {[1, 2, 3].map((i) => (
          <Card key={i} className="cursor-pointer hover:border-primary/50">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error Loading Tickets</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleRetryClick}>Try Again</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Jira Tickets</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshClick} 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {tickets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Tickets Found</CardTitle>
            <CardDescription>
              No Jira tickets were found for your account. Create some tickets in Jira or check your connection.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id}
              className={`cursor-pointer hover:border-primary/50 transition-colors ${selectedTicket?.id === ticket.id ? 'border-primary' : ''}`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ticket.key}</Badge>
                    <Badge 
                      variant={
                        ticket.status === 'To Do' ? 'secondary' :
                        ticket.status === 'In Progress' ? 'default' :
                        ticket.status === 'Done' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                  <Badge 
                    variant={
                      ticket.priority === 'High' ? 'destructive' :
                      ticket.priority === 'Medium' ? 'default' :
                      'secondary'
                    }
                  >
                    {ticket.priority}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{ticket.summary}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                {ticket.labels && ticket.labels.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {ticket.labels.map((label) => (
                      <Badge key={label} variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 flex justify-between text-xs text-gray-500">
                <div>Assignee: {ticket.assignee || 'Unassigned'}</div>
                {ticket.updated_at && (
                  <div className="flex items-center">
                    Updated: {format(new Date(ticket.updated_at), 'MMM d, yyyy')}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://${ticket.domain || ticket.key.split('-')[0].toLowerCase()}.atlassian.net/browse/${ticket.key}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryList;
