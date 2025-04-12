
import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink, RefreshCw, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const StoriesPage: React.FC = () => {
  const { isAuthenticated, fetchTickets, tickets, loading } = useStories();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isAuthenticated && Object.keys(tickets).length === 0) {
      fetchTickets();
    }
  }, [isAuthenticated, fetchTickets, tickets]);

  // Group tickets by project
  const ticketsByProject = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    tickets.forEach(ticket => {
      const projectKey = ticket.key.split('-')[0];
      if (!grouped[projectKey]) {
        grouped[projectKey] = [];
      }
      grouped[projectKey].push(ticket);
    });
    
    return grouped;
  }, [tickets]);

  const toggleProject = (projectKey: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectKey]: !prev[projectKey]
    }));
  };

  return (
    <AppLayout>
      <div className="container mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Jira Stories</h1>
          
          <div className="flex gap-2">
            {isAuthenticated && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTickets} 
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            )}
            
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {!isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>Jira Connection Required</CardTitle>
              <CardDescription>
                Please connect to Jira to view your stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/settings">Connect to Jira</Link>
              </Button>
            </CardContent>
          </Card>
        ) : loading && Object.keys(ticketsByProject).length === 0 ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(ticketsByProject).length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Stories Found</CardTitle>
                  <CardDescription>
                    No Jira stories were found for your account.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              Object.entries(ticketsByProject).map(([projectKey, projectTickets]) => (
                <Collapsible key={projectKey} defaultOpen={false} className="border rounded-lg">
                  <CollapsibleTrigger 
                    className="w-full flex justify-between items-center p-4 border-b hover:bg-slate-50"
                    onClick={() => toggleProject(projectKey)}
                  >
                    <div className="font-medium text-left flex items-center">
                      {expandedProjects[projectKey] ? 
                        <ChevronDown className="h-4 w-4 mr-2" /> : 
                        <ChevronRight className="h-4 w-4 mr-2" />
                      }
                      {projectKey} ({projectTickets.length} stories)
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-2">
                    <div className="space-y-2">
                      {projectTickets.map(ticket => (
                        <div key={ticket.id} className="flex justify-between items-center p-3 border rounded hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <Checkbox id={ticket.id} />
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{ticket.key}</Badge>
                                {ticket.status && (
                                  <Badge 
                                    variant={
                                      ticket.status === 'To Do' ? 'secondary' :
                                      ticket.status === 'In Progress' ? 'default' :
                                      'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {ticket.status}
                                  </Badge>
                                )}
                              </div>
                              <label htmlFor={ticket.id} className="cursor-pointer block mt-1">
                                {ticket.summary}
                              </label>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => window.open(`https://${ticket.domain || ticket.key.split('-')[0].toLowerCase()}.atlassian.net/browse/${ticket.key}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StoriesPage;
