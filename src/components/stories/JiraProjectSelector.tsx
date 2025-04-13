
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExternalLink, Filter } from "lucide-react";
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
    projectsLoading,
    sprintsLoading,
    ticketTypeFilter,
    setTicketTypeFilter
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
          <label htmlFor="sprint-select" className="text-sm font-medium">
            Sprint
          </label>
          {isLoadingSprints ? (
            <div className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm animate-pulse">
              Loading sprints...
            </div>
          ) : !selectedProject ? (
            <div className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
              Select a project first
            </div>
          ) : availableSprints.length === 0 ? (
            <LoadingContent 
              isWarning={true}
              message="No sprints found for this project"
              additionalMessage="The project may not use Scrum methodology or have active sprints."
            />
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
                {availableSprints.map(sprint => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name} ({sprint.state || 'active'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {selectedProject && (
            <div className="flex justify-end mt-1">
              <Button variant="outline" size="sm" onClick={() => window.open(`${selectedProject.domain}/browse/${selectedProject.key}`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Jira
              </Button>
            </div>
          )}
        </div>

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
