
import { useState } from "react";
import { Project } from "@/types";
import { supabase } from "@/lib/supabase";

export const useProjectOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async (): Promise<Project[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([{
          name: projectData.name || "Untitled Project",
          description: projectData.description || "",
          status: projectData.status || "active"
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err: any) {
      console.error("Error creating project:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, projectData: Partial<Project>): Promise<Project> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .update({
          name: projectData.name,
          description: projectData.description,
          status: projectData.status
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err: any) {
      console.error("Error updating project:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // First delete associated documents
      const { error: docError } = await supabase
        .from("documents")
        .delete()
        .eq("project_id", id);
      
      if (docError) {
        console.warn("Error deleting project documents:", docError);
        // Continue with project deletion even if document deletion fails
      }
      
      // Then delete the project
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("Error deleting project:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    loading,
    error
  };
};
