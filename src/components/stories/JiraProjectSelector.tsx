
import React, { useState, useEffect } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JiraProject, JiraSprint } from '@/types/jira';
import { AlertCircle, ExternalLink, Archive, RefreshCw, Calendar, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface JiraProjectSelectorProps {
  lastRefreshTime?: Date | null;
}

const JiraProjectSelector: React.FC<JiraProjectSelectorProps> = ({ lastRefreshTime }) => {
  const { 
    selectedProject, 
    setSelectedProject, 
    selectedSprint, 
    setSelectedSprint, 
    projects, 
    sprints, 
    sprintsLoading, 
    projectsLoading,
    fetchAllProjectsAtOnce,
    error,
    apiVersion,
    hasMoreProjects,
    totalTickets
  } = useStories();
  
  const [loadingAllProjects, setLoadingAllProjects] = useState(false);
  
  useEffect(() => {
    if (lastRefreshTime && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [lastRefreshTime, projects, selectedProject, setSelectedProject]);

  const handleChangeProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setSelectedSprint(null);
    }
  };

  const handleChangeSprint = (sprintId: string) => {
    if (!selectedProject) return;
    
    const sprint = sprints[selectedProject.id]?.find(s => s.id === sprintId);
    if (sprint) {
      setSelectedSprint(sprint);
    }
  };
  
  const handleLoadAllProjects = async () => {
    setLoadingAllProjects(true);
    try {
      await fetchAllProjectsAtOnce();
    } catch (err) {
      console.error('Error loading all projects:', err);
    } finally {
      setLoadingAllProjects(false);
    }
  };
  
  const getJiraProjectUrl = (project: JiraProject) => {
    if (!project.domain) return '#';
    return `${project.domain}/browse/${project.key}`;
  };
  
  const getSprintBadgeColor = (sprint: JiraSprint) => {
    const state = (sprint.state || '').toLowerCase();
    if (state === 'active') {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    } else if (state === 'future') {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    } else if (state === 'closed') {
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">
              Jira Project {apiVersion && <span className="text-xs text-muted-foreground">({apiVersion})</span>}
              {projects.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({projects.length} {hasMoreProjects ? '+ more' : 'loaded'})
                </span>
              )}
            </label>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLoadAllProjects}
              disabled={loadingAllProjects}
              className="h-8 px-2 text-xs"
            >
              {loadingAllProjects ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Archive className="h-3 w-3 mr-1" />
              )}
              Load All Projects
            </Button>
          </div>
          
          {projectsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex items-center space-x-2">
              <Select
                value={selectedProject?.id || ''}
                onValueChange={handleChangeProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center">
                        {project.avatarUrl && (
                          <img 
                            src={project.avatarUrl} 
                            alt={project.name} 
                            className="w-4 h-4 mr-2" 
                          />
                        )}
                        {project.name} ({project.key})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedProject && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => window.open(getJiraProjectUrl(selectedProject), '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {selectedProject && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Sprint</label>
              {sprints[selectedProject.id]?.length > 0 && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {sprints[selectedProject.id]?.length} sprints
                    {totalTickets > 0 && ` / ${totalTickets} issues`}
                  </span>
                </div>
              )}
            </div>
            
            {sprintsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : sprints[selectedProject.id]?.length ? (
              <Select
                value={selectedSprint?.id || ''}
                onValueChange={handleChangeSprint}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints[selectedProject.id]?.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      <div className="flex items-center space-x-2">
                        <span>
                          {sprint.name}
                        </span>
                        <Badge className={getSprintBadgeColor(sprint)}>
                          {sprint.state || 'Unknown'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Alert variant="default" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No sprints found for this project</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JiraProjectSelector;
