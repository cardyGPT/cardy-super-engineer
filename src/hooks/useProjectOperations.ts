
import { useCallback } from "react";
import { Project } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ToastActionElement } from "@/components/ui/toast";

type Toast = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive" | "success";
};

export const useProjectOperations = (
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: (props: Toast) => void
) => {
  const createProject = async (projectData: Partial<Project>) => {
    setLoading(true);
    try {
      // Map client model to database columns
      const newProject = {
        name: projectData.name,
        type: projectData.type || "web-application",
        details: projectData.details || "",
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();
      
      if (error) throw error;
      
      // Map database response to client model
      const formattedProject: Project = {
        id: data.id,
        name: data.name,
        type: data.type,
        details: data.details,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      setProjects((prev) => [...prev, formattedProject]);
      
      // Add success toast notification
      toast({
        title: "Project created",
        description: `${formattedProject.name} has been created successfully.`,
        variant: "success",
      });
      
      return formattedProject;
    } catch (error) {
      console.error("Error creating project:", error);
      
      // Add error toast notification
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProjects((prev) => prev.filter((project) => project.id !== id));
      
      // Add success toast notification
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      
      // Add error toast notification
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    setLoading(true);
    try {
      // Map client model to database columns
      const updatedProject = {
        name: projectData.name,
        type: projectData.type,
        details: projectData.details,
      };
      
      const { data, error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Map database response to client model
      const formattedProject: Project = {
        id: data.id,
        name: data.name,
        type: data.type,
        details: data.details,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      setProjects((prev) =>
        prev.map((project) => (project.id === id ? formattedProject : project))
      );
      
      // Add success toast notification
      toast({
        title: "Project updated",
        description: `${formattedProject.name} has been updated successfully.`,
        variant: "success",
      });
      
      return formattedProject;
    } catch (error) {
      console.error("Error updating project:", error);
      
      // Add error toast notification
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    createProject,
    deleteProject,
    updateProject,
  };
};
