
import { useState, useCallback } from "react";
import { Project } from "@/types";
import { supabase } from "@/lib/supabase";
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
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      toast({
        title: "Loading projects",
        description: "Fetching your projects and documents...",
      });

      const { data: projects, error } = await supabase
        .from('projects')
        .select('*');

      if (error) throw error;
      
      // Map database fields to client-side model
      const formattedProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        details: p.details || "",
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      
      setProjects(formattedProjects);

      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('*');

      if (docError) throw docError;
      
      toast({
        title: "Data loaded",
        description: `Successfully loaded ${formattedProjects.length} projects and ${documents?.length || 0} documents.`,
        variant: "success",
      });
      
      // Documents will be set through context state
      return { projects: formattedProjects, documents };
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, toast]);

  const addProject = async (projectData: Partial<Project>) => {
    setLoading(true);
    try {
      toast({
        title: "Creating project",
        description: `Creating project "${projectData.name}"...`,
      });

      // Convert client model to database columns
      const newProject = {
        name: projectData.name || "",
        type: projectData.type || "Child Welfare",
        details: projectData.details || "",
      };
      
      console.log("Creating project with data:", newProject);
      
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();
      
      if (error) {
        console.error("Error adding project:", error);
        throw error;
      }
      
      // Map database response to client model
      const formattedProject: Project = {
        id: data.id,
        name: data.name,
        type: data.type,
        details: data.details || "",
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      setProjects((prev) => [...prev, formattedProject]);
      toast({
        title: "Project created",
        description: `Project "${data.name}" has been created successfully.`,
        variant: "success",
      });
      
      return formattedProject;
    } catch (error) {
      console.error("Error adding project:", error);
      let errorMessage = "Failed to create project. Please try again.";
      
      // Extract more specific error message if available
      if (error instanceof Error) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "A project with this name already exists.";
        } else if (error.message.includes("violates not-null")) {
          errorMessage = "Please provide all required fields.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (updatedProject: Project) => {
    setLoading(true);
    try {
      toast({
        title: "Updating project",
        description: `Updating project "${updatedProject.name}"...`,
      });

      // Convert client model to database columns
      const updates = {
        name: updatedProject.name,
        type: updatedProject.type,
        details: updatedProject.details || "",
      };
      
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', updatedProject.id);
      
      if (error) throw error;
      
      // Update local state
      setProjects((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        )
      );
      
      toast({
        title: "Project updated",
        description: `Project "${updatedProject.name}" has been updated successfully.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      let errorMessage = "Failed to update project. Please try again.";
      
      // Extract more specific error message if available
      if (error instanceof Error) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "A project with this name already exists.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    setLoading(true);
    try {
      const projectToDelete = projects.find(p => p.id === id);
      
      toast({
        title: "Deleting project",
        description: projectToDelete 
          ? `Deleting project "${projectToDelete.name}"...` 
          : "Deleting project...",
      });

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProjects((prev) => prev.filter((project) => project.id !== id));
      
      toast({
        title: "Project deleted",
        description: projectToDelete 
          ? `Project "${projectToDelete.name}" has been deleted successfully.` 
          : "Project has been deleted successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchProjects,
    addProject,
    updateProject,
    deleteProject
  };
};
