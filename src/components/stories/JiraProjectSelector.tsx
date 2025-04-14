
import React, { useState, useEffect } from "react";
import { useStories } from "@/contexts/StoriesContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FolderOpen, 
  Clock, 
  CalendarCheck, 
  CalendarX, 
  Loader2,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface JiraProjectSelectorProps {
  lastRefreshTime?: Date | null;
}

const JiraProjectSelector: React.FC<JiraProjectSelectorProps> = ({ 
  lastRefreshTime 
}) => {
  const { 
    projects, 
    sprints,
    selectedProject, 
    selectedSprint,
    setSelectedProject, 
    setSelectedSprint,
    fetchSprints,
    fetchTickets,
    fetchTicketsByProject,
    projectsLoading,
    sprintsLoading,
    hasMoreProjects,
    isLoadingMoreProjects,
    fetchMoreProjects,
    fetchAllProjectsAtOnce,
    apiVersion
  } = useStories();

  const [isLoadingSprints, setIsLoadingSprints] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Reset selections when projects change (e.g., after refresh)
  useEffect(() => {
    if (lastRefreshTime && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [lastRefreshTime, projects, selectedProject, setSelectedProject]);

  // Load more projects when scrolling to the bottom of the select list
  useEffect(() => {
    if (isSelectOpen && hasMoreProjects && !isLoadingMoreProjects && !projectsLoading) {
      fetchMoreProjects();
    }
  }, [isSelectOpen, hasMoreProjects, isLoadingMoreProjects, projectsLoading, fetchMoreProjects]);

  const handleProjectChange = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    setSelectedProject(project);
    setSelectedSprint(null);
    
    // Load sprints for the selected project
    setIsLoadingSprints(true);
    try {
      await fetchSprints(projectId);
    } finally {
      setIsLoadingSprints(false);
    }
  };

  const handleSprintChange = async (sprintId: string) => {
    if (!selectedProject) return;
    
    const projectSprints = sprints[selectedProject.id] || [];
    const sprint = projectSprints.find(s => s.id === sprintId);
    if (!sprint) return;
    
    setSelectedSprint(sprint);
    
    // Load tickets for the selected sprint
    setIsLoadingTickets(true);
    try {
      await fetchTickets(sprintId);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleViewAllStories = async () => {
    if (!selectedProject) return;
    
    setSelectedSprint(null);
    setIsLoadingTickets(true);
    
    try {
      await fetchTicketsByProject(selectedProject.id);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleLoadAllProjects = async () => {
    await fetchAllProjectsAtOnce();
  };

  // Get sprints for the selected project
  const projectSprints = selectedProject ? (sprints[selectedProject.id] || []) : [];

  // Get a color and icon based on sprint state
  const getSprintStateProps = (state: string) => {
    // Ensure state is a string
    const stateStr = String(state || '').toLowerCase();
    
    if (stateStr === 'active') {
      return { 
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, 
        text: '(active)',
        badge: <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 ml-2">Active</Badge>
      };
    }
    if (stateStr === 'future') {
      return { 
        icon: <CalendarCheck className="h-4 w-4 text-blue-500" />, 
        text: '(future)',
        badge: <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 ml-2">Future</Badge>
      };
    }
    if (stateStr === 'closed') {
      return { 
        icon: <CalendarX className="h-4 w-4 text-gray-500" />, 
        text: '(closed)',
        badge: <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 ml-2">Closed</Badge>
      };
    }
    return { 
      icon: <Clock className="h-4 w-4 text-gray-500" />, 
      text: '',
      badge: null
    };
  };

  return (
    <div className="space-y-4 bg-white dark:bg-card rounded-lg border border-border p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Select Project & Sprint</h2>
        
        {apiVersion && (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
            {apiVersion === 'agile' ? 'Jira Agile' : apiVersion === 'cloud' ? 'Jira Cloud' : 'Jira Classic'}
          </Badge>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">Project</label>
          
          {projectsLoading && projects.length === 0 ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <Select
                value={selectedProject?.id}
                onValueChange={handleProjectChange}
                disabled={projectsLoading}
                onOpenChange={setIsSelectOpen}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center">
                        <FolderOpen className="h-4 w-4 mr-2 text-primary" />
                        {project.name} {project.key && `(${project.key})`}
                      </div>
                    </SelectItem>
                  ))}
                  
                  {isLoadingMoreProjects && (
                    <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading more projects...
                    </div>
                  )}
                  
                  {!isLoadingMoreProjects && hasMoreProjects && (
                    <div className="flex items-center justify-center py-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={e => {
                          e.preventDefault();
                          fetchMoreProjects();
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load more projects
                      </Button>
                    </div>
                  )}
                  
                  {projects.length > 0 && !projectsLoading && !isLoadingMoreProjects && (
                    <div className="flex items-center justify-center py-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={e => {
                          e.preventDefault();
                          handleLoadAllProjects();
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load all projects
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              
              <div className="text-xs text-muted-foreground">
                {projects.length > 0 && `${projects.length} project${projects.length !== 1 ? 's' : ''} loaded`}
                {hasMoreProjects && ' (more available)'}
              </div>
            </>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">Sprint</label>
          
          {(sprintsLoading || isLoadingSprints) ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <Select
                value={selectedSprint?.id}
                onValueChange={handleSprintChange}
                disabled={!selectedProject || sprintsLoading || isLoadingSprints}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {projectSprints.map((sprint) => {
                    const { icon, badge } = getSprintStateProps(sprint.state);
                    return (
                      <SelectItem key={sprint.id} value={sprint.id}>
                        <div className="flex items-center">
                          {icon}
                          <span className="ml-2">{sprint.name}</span>
                          {badge}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {selectedProject && projectSprints.length === 0 && !sprintsLoading && !isLoadingSprints && (
                <div className="text-xs text-muted-foreground mt-1">
                  No sprints found for this project
                </div>
              )}
              
              {selectedProject && !selectedSprint && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={handleViewAllStories}
                  disabled={isLoadingTickets}
                >
                  {isLoadingTickets ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>View all stories from project</>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JiraProjectSelector;
