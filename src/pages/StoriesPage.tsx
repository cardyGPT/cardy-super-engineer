
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink, RefreshCw, Settings, ChevronDown, AlertTriangle, FileText, Database } from "lucide-react";
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
import { supabase } from "@/lib/supabase";

const StoriesPage: React.FC = () => {
  const { 
    isAuthenticated, 
    loading, 
    projects: jiraProjects, 
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
  const [projectsForContext, setProjectsForContext] = useState<any[]>([]);
  const [selectedProjectContext, setSelectedProjectContext] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
    fetchProjectsForContext();
  }, []);

  const fetchProjectsForContext = async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, type')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setProjectsForContext(data);
      }
    } catch (err: any) {
      console.error("Error fetching projects for context:", err);
      toast({
        title: "Error",
        description: "Failed to load projects for context",
        variant: "destructive"
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchDocumentsForProject = async (projectId: string) => {
    setLoadingDocuments(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, type')
        .eq('project_id', projectId)
        .order('name');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setAvailableDocuments(data);
        setSelectedDocuments([]); // Reset selection when project changes
      }
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      toast({
        title: "Error",
        description: "Failed to load project documents",
        variant: "destructive"
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleProjectContextChange = (projectId: string) => {
    setSelectedProjectContext(projectId);
    fetchDocumentsForProject(projectId);
  };

  const handleDocumentSelectionChange = (documentId: string) => {
    setSelectedDocuments(prevSelected => {
      if (prevSelected.includes(documentId)) {
        return prevSelected.filter(id => id !== documentId);
      } else {
        return [...prevSelected, documentId];
      }
    });
  };

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
    const project = jiraProjects.find(p => p.id === projectId);
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
              {loading && jiraProjects.length === 0 ? (
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
                      {jiraProjects.length === 0 ? (
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
                          disabled={loading || jiraProjects.length === 0}
                        >
                          <SelectTrigger id="project-select" className="w-full">
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          <SelectContent>
                            {jiraProjects.map(project => (
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

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Project Context for Generation</CardTitle>
                  <CardDescription>
                    Select project context to enhance artifact generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="context-project-select" className="text-sm font-medium">
                      Project for Context
                    </label>
                    {loadingProjects ? (
                      <Skeleton className="h-10 w-full rounded-md" />
                    ) : projectsForContext.length === 0 ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Projects Found</AlertTitle>
                        <AlertDescription>
                          No projects available for context. Create a project first.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Select 
                        value={selectedProjectContext || ""} 
                        onValueChange={handleProjectContextChange}
                        disabled={loadingProjects || projectsForContext.length === 0}
                      >
                        <SelectTrigger id="context-project-select" className="w-full">
                          <SelectValue placeholder="Select a project for context" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectsForContext.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name} ({project.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  {selectedProjectContext && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Documents for Context
                      </label>
                      {loadingDocuments ? (
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-full" />
                        </div>
                      ) : availableDocuments.length === 0 ? (
                        <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                          No documents available for this project. Upload documents in the Documents page.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                          {availableDocuments.map(doc => (
                            <div key={doc.id} className="flex items-start space-x-2">
                              <Checkbox 
                                id={`doc-${doc.id}`} 
                                checked={selectedDocuments.includes(doc.id)}
                                onCheckedChange={() => handleDocumentSelectionChange(doc.id)}
                              />
                              <label 
                                htmlFor={`doc-${doc.id}`} 
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {doc.name}
                                <span className="text-xs text-muted-foreground ml-1">({doc.type})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedDocuments.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <StoryList />
            </div>

            <div className="space-y-4">
              <StoryDetailWrapper 
                projectContext={selectedProjectContext} 
                selectedDocuments={selectedDocuments}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StoriesPage;
