
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExternalLink, Filter } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useStories } from "@/contexts/StoriesContext";
import LoadingContent from "./LoadingContent";

interface JiraProjectSelectorProps {
  lastRefreshTime: Date | null;
}

const JiraProjectSelector: React.FC<JiraProjectSelectorProps> = ({ lastRefreshTime }) => {
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
    ticketTypeFilter,
    setTicketTypeFilter,
    ticketStatusFilter,
    setTicketStatusFilter
  } = useStories();

  const handleProjectChange = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (project && (!selectedProject || selectedProject.id !== project.id)) {
      setSelectedProject(project);
      setSelectedSprint(null);
      
      if (!sprints[project.id] || sprints[project.id].length === 0) {
        fetchSprints(project.id);
      }
    }
  };

  const handleSprintChange = (sprintId: string) => {
    if (!selectedProject) return;
    
    if (sprintId === "all-project-tickets") {
      setSelectedSprint(null);
      fetchTicketsByProject(selectedProject.id);
      return;
    }
    
    const projectSprints = sprints[selectedProject.id] || [];
    const sprint = projectSprints.find(s => s.id === sprintId);
    
    if (sprint) {
      setSelectedSprint(sprint);
      fetchTickets(sprint.id);
    }
  };

  const handleTypeFilterChange = (value: string) => {
    setTicketTypeFilter(value === "all" ? null : value);
  };
  
  const handleStatusFilterChange = (value: string) => {
    setTicketStatusFilter(value === "all" ? null : value);
  };

  const isLoadingSprints = sprintsLoading && selectedProject && (!sprints[selectedProject?.id] || sprints[selectedProject?.id].length === 0);
  const availableSprints = selectedProject ? (sprints[selectedProject.id] || []) : [];

  return (
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
            <LoadingContent 
              isLoading={projectsLoading}
              isError={!projectsLoading}
              message={projectsLoading ? "Loading projects..." : "No Projects Found"}
              additionalMessage="Make sure your Jira account has access to at least one project."
            />
          ) : (
            <Select 
              value={selectedProject?.id || ""} 
              onValueChange={handleProjectChange}
              disabled={projectsLoading}
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
          <div className="flex items-center justify-between">
            <label htmlFor="sprint-select" className="text-sm font-medium">
              Sprint
            </label>
            {selectedProject && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => window.open(`${selectedProject.domain}/browse/${selectedProject.key}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View in Jira</span>
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <p className="text-sm">View in Jira</p>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
          
          {isLoadingSprints ? (
            <div className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm animate-pulse">
              Loading sprints...
            </div>
          ) : !selectedProject ? (
            <div className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
              Select a project first
            </div>
          ) : availableSprints.length === 0 ? (
            <div className="space-y-2">
              <LoadingContent 
                isWarning={true}
                message="No sprints found for this project"
                additionalMessage="The project may not use Scrum methodology or have active sprints."
              />
              <Select
                value="all-project-tickets"
                onValueChange={handleSprintChange}
              >
                <SelectTrigger id="all-sprint-select" className="w-full">
                  <SelectValue placeholder="View all project tickets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-project-tickets">All project tickets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Select 
              value={selectedSprint?.id || ""}
              onValueChange={handleSprintChange}
              disabled={!selectedProject || availableSprints.length === 0}
            >
              <SelectTrigger id="sprint-select" className="w-full">
                <SelectValue placeholder="Select a sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-project-tickets">All project tickets</SelectItem>
                {availableSprints.map(sprint => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name} ({sprint.state || 'active'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="type-filter-select" className="text-sm font-medium flex items-center">
              <Filter className="h-3 w-3 mr-1" />
              Filter by Type
            </label>
            <Select 
              value={ticketTypeFilter || "all"} 
              onValueChange={handleTypeFilterChange}
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
          
          <div className="space-y-2">
            <label htmlFor="status-filter-select" className="text-sm font-medium flex items-center">
              <Filter className="h-3 w-3 mr-1" />
              Filter by Status
            </label>
            <Select 
              value={ticketStatusFilter || "all"} 
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger id="status-filter-select" className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {lastRefreshTime && (
          <div className="text-xs text-muted-foreground text-right pt-2">
            Last refreshed: {lastRefreshTime.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JiraProjectSelector;
