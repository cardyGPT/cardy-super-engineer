
import React, { createContext, useState, useContext, useEffect } from "react";
import { Project, ProjectDocument, DataModel } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  documents: ProjectDocument[];
  dataModel: DataModel | null;
  loading: boolean;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Partial<Project>) => Promise<Project | undefined>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  uploadDocument: (document: Partial<ProjectDocument>, file: File) => Promise<ProjectDocument | undefined>;
  deleteDocument: (id: string) => Promise<void>;
  setDataModel: (dataModel: DataModel) => void;
  getDocumentDataModel: (documentId: string) => DataModel | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [documentList, setDocumentList] = useState<ProjectDocument[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [dataModel, setDataModel] = useState<DataModel | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch initial data from Supabase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*');

        if (error) throw error;
        
        setProjectList(projects);

        const { data: documents, error: docError } = await supabase
          .from('documents')
          .select('*');

        if (docError) throw docError;
        
        setDocumentList(documents);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  const addProject = async (projectData: Partial<Project>) => {
    setLoading(true);
    try {
      // Fix: Use snake_case for column names to match the database
      const newProject = {
        name: projectData.name || "",
        type: projectData.type || "Child Welfare",
        details: projectData.details || "",
        // Don't include createdAt and updatedAt - the database will set these with default values
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();
      
      if (error) {
        console.error("Error adding project:", error);
        throw error;
      }
      
      setProjectList((prev) => [...prev, data]);
      toast({
        title: "Project created",
        description: `Project ${data.name} has been created successfully.`,
      });
      return data;
    } catch (error) {
      console.error("Error adding project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (updatedProject: Project) => {
    setLoading(true);
    try {
      // Fix: Only send fields that we want to update and match database column names
      const updates = {
        name: updatedProject.name,
        type: updatedProject.type,
        details: updatedProject.details,
        // Don't include updated_at - let the database handle this
      };
      
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', updatedProject.id);
      
      if (error) throw error;
      
      // Update local state
      setProjectList((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id ? {...project, ...updates} : project
        )
      );
      
      if (currentProject?.id === updatedProject.id) {
        setCurrentProject({...currentProject, ...updates});
      }
      
      toast({
        title: "Project updated",
        description: `Project ${updatedProject.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    setLoading(true);
    try {
      // First delete associated documents
      const { error: docsError } = await supabase
        .from('documents')
        .delete()
        .eq('projectId', id);
      
      if (docsError) throw docsError;
      
      // Then delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProjectList((prev) => prev.filter((project) => project.id !== id));
      setDocumentList((prev) => prev.filter((doc) => doc.projectId !== id));
      
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully.",
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

  const uploadDocument = async (documentData: Partial<ProjectDocument>, file: File) => {
    setLoading(true);
    try {
      // First upload the file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentData.projectId}/${Date.now()}.${fileExt}`;
      
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Create a public URL for the file
      const { data: urlData } = await supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      let fileContent = null;
      
      // If it's a data model, attempt to parse the JSON content
      if (documentData.type === "data-model") {
        try {
          const text = await file.text();
          fileContent = JSON.parse(text);
          
          // Basic validation of data model structure
          if (!fileContent.entities || !Array.isArray(fileContent.entities) || 
              !fileContent.relationships || !Array.isArray(fileContent.relationships)) {
            throw new Error("Invalid data model format");
          }
        } catch (parseError) {
          toast({
            title: "Error parsing JSON",
            description: "The data model file is not valid JSON or has incorrect format.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }
      
      const newDocument: Omit<ProjectDocument, 'id'> = {
        projectId: documentData.projectId || "",
        name: file.name,
        type: documentData.type || "system-requirements",
        fileUrl: urlData.publicUrl,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        content: fileContent,
      };
      
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([newDocument])
        .select()
        .single();
      
      if (docError) throw docError;
      
      setDocumentList((prev) => [...prev, docData]);
      
      if (docData.type === "data-model" && docData.content) {
        setDataModel(docData.content);
      }
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      });
      
      return docData;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setLoading(true);
    try {
      // First get the document to find the file path
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete the file from storage if we have a URL
      if (doc.fileUrl) {
        const fileName = doc.fileUrl.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([fileName]);
          
          if (storageError) console.error("Error removing file from storage:", storageError);
        }
      }
      
      // Delete the document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDocumentList((prev) => prev.filter((doc) => doc.id !== id));
      
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentDataModel = (documentId: string): DataModel | null => {
    const document = documentList.find(doc => doc.id === documentId);
    if (document && document.type === "data-model" && document.content) {
      return document.content;
    }
    return null;
  };

  return (
    <ProjectContext.Provider
      value={{
        projects: projectList,
        documents: documentList,
        currentProject,
        dataModel,
        loading,
        setCurrentProject,
        addProject,
        updateProject,
        deleteProject,
        uploadDocument,
        deleteDocument,
        setDataModel,
        getDocumentDataModel,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
