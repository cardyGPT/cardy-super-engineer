import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink, RefreshCw, Settings, ChevronDown, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import StoryList from "@/components/stories/StoryList";
import StoryDetailWrapper from "@/components/stories/StoryDetailWrapper";

const StoriesPage: React.FC = () => {
  const { 
    isAuthenticated, 
    loading, 
    projects, 
    sprints,
    selectedProject, 
    setSelectedProject,
    selectedSprint, 
    setSelectedSprint,
    fetchProjects,
    fetchSprints,
    fetchTickets,
    error,
    selectedTicket
  } = useStories();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  const handleRefresh = async () => {
    if (loading || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchProjects();
      setIsRefreshing(false);
    } catch (err) {
      setIsRefreshing(false);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && (!selectedProject || selectedProject.id !== project.id)) {
      setSelectedProject(project);
      setSelectedSprint(null);
      fetchSprints(project.id);
    }
  };

  const handleSprintChange = (sprintId: string) => {
    if (!selectedProject) return;
    
    const projectSprints = sprints[selectedProject.id] || [];
    const sprint = projectSprints.find(s => s.id === sprintId);
    if (sprint && (!selectedSprint || selectedSprint.id !== sprint.id)) {
      setSelectedSprint(sprint);
      fetchTickets(sprint.id);
    }
  };
  
  useEffect(() => {
    if (error && pageLoaded) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast, pageLoaded]);

  const isLoadingSprints = loading && selectedProject && (!sprints[selectedProject?.id] || sprints[selectedProject?.id].length === 0);
  
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
                onClick={handleRefresh} 
                disabled={loading || isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                {(loading || isRefreshing) ? 'Loading...' : 'Refresh'}
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {loading && projects.length === 0 ? (
                <Card className="animate-pulse">
                  <CardHeader>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-60" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Select Project & Sprint</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="project-select" className="text-sm font-medium">
                        Project
                      </label>
                      {projects.length === 0 ? (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>No Projects Found</AlertTitle>
                          <AlertDescription>
                            No projects were found in your Jira account. Make sure you have the correct permissions.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Select 
                          value={selectedProject?.id || ""} 
                          onValueChange={handleProjectChange}
                          disabled={loading || projects.length === 0}
                        >
                          <SelectTrigger id="project-select" className="w-full">
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name} ({project.key})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="sprint-select" className="text-sm font-medium">
                        Sprint
                      </label>
                      {isLoadingSprints ? (
                        <Skeleton className="h-10 w-full rounded-md" />
                      ) : selectedProject && (sprints[selectedProject?.id] || []).length === 0 ? (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>No Sprints Found</AlertTitle>
                          <AlertDescription>
                            No sprints were found for this project. Make sure the project uses Scrum methodology.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Select 
                          value={selectedSprint?.id || ""} 
                          onValueChange={handleSprintChange}
                          disabled={!selectedProject || (sprints[selectedProject?.id || ''] || []).length === 0}
                        >
                          <SelectTrigger id="sprint-select" className="w-full">
                            <SelectValue placeholder="Select a sprint" />
                          </SelectTrigger>
                          <SelectContent>
                            {(sprints[selectedProject?.id || ''] || []).map(sprint => (
                              <SelectItem key={sprint.id} value={sprint.id}>
                                {sprint.name} ({sprint.state})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <StoryList />
            </div>

            <div className="space-y-4">
              <StoryDetailWrapper />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StoriesPage;
