import React, { createContext, useState, useContext, useEffect } from "react";
import { Project, ProjectDocument, DataModel } from "@/types";
import { projects, documents, sampleDataModel } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  documents: ProjectDocument[];
  dataModel: DataModel | null;
  loading: boolean;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Partial<Project>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  uploadDocument: (document: Partial<ProjectDocument>) => void;
  deleteDocument: (id: string) => void;
  setDataModel: (dataModel: DataModel) => void;
  getDocumentDataModel: (documentId: string) => DataModel | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectList, setProjectList] = useState<Project[]>(projects);
  const [documentList, setDocumentList] = useState<ProjectDocument[]>(documents);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [dataModel, setDataModel] = useState<DataModel | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addProject = (projectData: Partial<Project>) => {
    setLoading(true);
    try {
      const newProject: Project = {
        id: `p${Date.now()}`,
        name: projectData.name || "",
        type: projectData.type || "Child Welfare",
        details: projectData.details || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setProjectList((prev) => [...prev, newProject]);
      toast({
        title: "Project created",
        description: `Project ${newProject.name} has been created successfully.`,
      });
      return newProject;
    } catch (error) {
      console.error("Error adding project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = (updatedProject: Project) => {
    setLoading(true);
    try {
      setProjectList((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id
            ? { ...updatedProject, updatedAt: new Date().toISOString() }
            : project
        )
      );
      
      if (currentProject?.id === updatedProject.id) {
        setCurrentProject({ ...updatedProject, updatedAt: new Date().toISOString() });
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = (id: string) => {
    setLoading(true);
    try {
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = (documentData: Partial<ProjectDocument>) => {
    setLoading(true);
    try {
      const newDocument: ProjectDocument = {
        id: `d${Date.now()}`,
        projectId: documentData.projectId || "",
        name: documentData.name || "",
        type: documentData.type || "system-requirements",
        fileUrl: documentData.fileUrl || "",
        fileType: documentData.fileType || "",
        uploadedAt: new Date().toISOString(),
        content: documentData.content || null,
      };
      
      setDocumentList((prev) => [...prev, newDocument]);
      
      if (newDocument.type === "data-model" && newDocument.content) {
        setDataModel(newDocument.content);
      }
      
      return newDocument;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = (id: string) => {
    setLoading(true);
    try {
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
      throw error;
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
