
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { JiraCredentials, JiraProject, JiraSprint } from '@/types/jira';
import { fetchJiraProjects, fetchJiraSprints } from '../api';

export const useProjectsAndSprints = (
  credentials: JiraCredentials | null,
  setError: (error: string | null) => void
) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [sprints, setSprints] = useState<Record<string, JiraSprint[]>>({});
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);
  const { toast } = useToast();

  // Reset states when project changes
  useEffect(() => {
    if (selectedProject) {
      // When project changes, clear selected sprint and ticket
      setSelectedSprint(null);
      
      // If we already have sprints for this project, no need to fetch
      if (!sprints[selectedProject.id] || sprints[selectedProject.id].length === 0) {
        try {
          console.log(`No cached sprints for project ${selectedProject.id}, fetching...`);
          fetchSprints(selectedProject.id);
        } catch (err) {
          console.error("Error initiating sprint fetch:", err);
        }
      }
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching Jira projects...');
      const projectsData = await fetchJiraProjects(credentials);
      
      if (projectsData && Array.isArray(projectsData)) {
        setProjects(projectsData);
        console.log(`Fetched ${projectsData.length} Jira projects`);
      } else {
        console.error('Invalid projects data format:', projectsData);
        throw new Error('Invalid response format for projects');
      }
    } catch (err: any) {
      console.error('Error fetching Jira projects:', err);
      setError(err.message || 'Failed to fetch Jira projects');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira projects',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSprints = async (projectId?: string) => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return;
    }

    const projectToUse = projectId || selectedProject?.id;

    if (!projectToUse) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching sprints for project ID: ${projectToUse}`);
      const sprintsData = await fetchJiraSprints(credentials, projectToUse);
      
      // Check if sprints received are for the current selected project
      // This prevents race conditions where project was changed during fetch
      setSprints(prev => ({ ...prev, [projectToUse]: sprintsData }));
      
      if (sprintsData.length === 0) {
        console.log(`No sprints found for project ID: ${projectToUse}`);
        toast({
          title: "No Sprints Found",
          description: "This project doesn't have any sprints available",
          variant: "default",
        });
      } else {
        console.log(`Found ${sprintsData.length} sprints for project ID: ${projectToUse}`);
        
        // If there's only one sprint and it's for the current selected project, select it automatically
        if (selectedProject && selectedProject.id === projectToUse && sprintsData.length === 1) {
          setSelectedSprint(sprintsData[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching Jira sprints:', err);
      setError(err.message || 'Failed to fetch Jira sprints');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch Jira sprints',
        variant: "destructive",
      });
      
      // Set an empty array for sprints to prevent continual loading state
      setSprints(prev => ({ ...prev, [projectToUse]: [] }));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    projects,
    sprints,
    selectedProject,
    setSelectedProject,
    selectedSprint,
    setSelectedSprint,
    fetchProjects,
    fetchSprints
  };
};
