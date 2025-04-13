
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink, RefreshCw, Settings, AlertTriangle, Database, Filter, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import StoryList from "@/components/stories/StoryList";
import StoryDetailWrapper from "@/components/stories/StoryDetailWrapper";
import { supabase } from "@/lib/supabase";
import ContextSettingsDialog from "@/components/stories/ContextSettingsDialog";
import { ProjectContextData } from "@/types/jira";

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
    ticketTypeFilter,
    setTicketTypeFilter
  } = useStories();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sprintError, setSprintError] = useState<string | null>(null);
  const { toast } = useToast();
  const [pageLoaded, setPageLoaded] = useState(false);
  const [selectedProjectContext, setSelectedProjectContext] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const [projectContextData, setProjectContextData] = useState<ProjectContextData | null>(null);

  useEffect(() => {
    setPageLoaded(true);
    loadSavedContext();
  }, []);

  const loadSavedContext = async () => {
    try {
      const { data, error } = await supabase
        .from('project_context')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Error loading saved context:", error);
        return;
      }
      
      if (data) {
        setSelectedProjectContext(data.project_id);
        setSelectedDocuments(data.document_ids || []);
        
        await loadProjectContextData(data.project_id, data.document_ids || []);
      }
    } catch (err: any) {
      console.error("Error loading saved context:", err);
    }
  };

  const loadProjectContextData = async (projectId: string, documentIds: string[]) => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name, type')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        console.error("Error loading project data:", projectError);
        return;
      }
      
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, name, type')
        .in('id', documentIds);
      
      if (documentsError) {
        console.error("Error loading document data:", documentsError);
        return;
      }
      
      setProjectContextData({
        project: projectData,
        documents: documentsData || []
      });
    } catch (err) {
      console.error("Error loading project context data:", err);
    }
  };

  const handleSaveContext = async (projectId: string | null, documentIds: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('save-context', {
        body: {
          projectId,
          documentIds
        }
      });
      
      if (error) {
        console.error("Error saving context:", error);
        throw new Error("Failed to save context settings");
      }
      
      setSelectedProjectContext(projectId);
      setSelectedDocuments(documentIds);
      
      if (projectId) {
        await loadProjectContextData(projectId, documentIds);
        
        toast({
          title: "Context Saved",
          description: "Project context has been updated successfully"
        });
      } else {
        setProjectContextData(null);
        
        toast({
          title: "Context Cleared",
          description: "Project context has been cleared"
        });
      }
    } catch (err: any) {
      console.error("Error saving context:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save context",
        variant: "destructive"
      });
      throw err;
    }
  };

  const handleRefresh = async () => {
    if (loading || isRefreshing) return;
    
    setIsRefreshing(true);
    setSprintError(null);
    try {
      await fetchProjects();
      
      if (selectedProject) {
        await fetchSprints(selectedProject.id);
      }
      
      setIsRefreshing(false);
      
      toast({
        title: "Refreshed",
        description: "Jira data has been refreshed"
      });
    } catch (err) {
      setIsRefreshing(false);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    }
  };

  const handleProjectChange = async (projectId: string) => {
    const project = jiraProjects.find(p => p.id === projectId);
    if (project && (!selectedProject || selectedProject.id !== project.id)) {
      setSelectedProject(project);
      setSelectedSprint(null);
      setSprintError(null);
      
      try {
        await fetchSprints(project.id);
      } catch (err: any) {
        console.error("Error fetching sprints:", err);
        setSprintError(err.message || "Failed to fetch sprints");
        toast({
          title: "Error",
          description: err.message || "Failed to fetch sprints",
          variant: "destructive",
        });
      }
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

  const handleTypeFilterChange = (type: string | null) => {
    setTicketTypeFilter(type);
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsContextDialogOpen(true)}
            >
              <Database className="h-4 w-4 mr-2" />
              Context
            </Button>
            
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

        {projectContextData && (
          <div className="mb-4">
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium">Context:</span>
                    <span className="ml-2">{projectContextData.project.name} ({projectContextData.project.type})</span>
                    {projectContextData.documents.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {projectContextData.documents.length} document{projectContextData.documents.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsContextDialogOpen(true)}
                  >
                    <Sliders className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                      <div className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm animate-pulse">
                        Loading sprints...
                      </div>
                    ) : sprintError ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Sprint Fetch Error</AlertTitle>
                        <AlertDescription>
                          {sprintError}
                        </AlertDescription>
                      </Alert>
                    ) : selectedProject && (!sprints[selectedProject?.id] || sprints[selectedProject?.id].length === 0) ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Sprints Found</AlertTitle>
                        <AlertDescription>
                          No active sprints were found for this project. Make sure the project uses Scrum methodology, has boards configured, and has active sprints.
                        </AlertDescription>
                        <div className="mt-2">
                          <Button variant="outline" size="sm" onClick={() => window.open(`${selectedProject.domain}/browse/${selectedProject.key}`, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View in Jira
                          </Button>
                        </div>
                      </Alert>
                    ) : (
                      <Select 
                        value={selectedSprint?.id || ""} 
                        onValueChange={handleSprintChange}
                        disabled={!selectedProject || !sprints[selectedProject?.id] || sprints[selectedProject?.id].length === 0}
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

                  <div className="space-y-2">
                    <label htmlFor="type-filter-select" className="text-sm font-medium flex items-center">
                      <Filter className="h-3 w-3 mr-1" />
                      Filter by Type
                    </label>
                    <Select 
                      value={ticketTypeFilter || "all"} 
                      onValueChange={(value) => handleTypeFilterChange(value === "all" ? null : value)}
                    >
                      <SelectTrigger id="type-filter-select" className="w-full">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="Story">Story</SelectItem>
                        <SelectItem value="Bug">Bug</SelectItem>
                        <SelectItem value="Task">Task</SelectItem>
                        <SelectItem value="Sub-task">Sub-task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <StoryList />
            </div>

            <div className="space-y-4">
              <StoryDetailWrapper 
                projectContext={selectedProjectContext} 
                selectedDocuments={selectedDocuments}
                projectContextData={projectContextData}
              />
            </div>
          </div>
        )}
      </div>
      
      <ContextSettingsDialog 
        open={isContextDialogOpen}
        onOpenChange={setIsContextDialogOpen}
        projectContext={selectedProjectContext}
        selectedDocuments={selectedDocuments}
        onSave={handleSaveContext}
        projectContextData={projectContextData}
      />
    </AppLayout>
  );
};

export default StoriesPage;
