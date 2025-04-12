
import React, { createContext, useState, useContext, useEffect } from "react";
import { Project, ProjectDocument, DataModel } from "@/types";
import { useToast } from "@/hooks/use-toast"; 
import { useProjectOperations } from "@/hooks/useProjectOperations";
import { useDocumentOperations } from "@/hooks/useDocumentOperations";
import { useDataModelOperations } from "@/hooks/useDataModelOperations";

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

  const projectOps = useProjectOperations();
  const documentOps = useDocumentOperations();
  const dataModelOps = useDataModelOperations(documentList);

  // Wrap the project operations to fit the expected interface
  const addProject = async (project: Partial<Project>): Promise<Project | undefined> => {
    try {
      const result = await projectOps.createProject(project);
      if (result) {
        setProjectList(prev => [...prev, result]);
      }
      return result;
    } catch (error) {
      console.error("Failed to add project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
      return undefined;
    }
  };

  const updateProject = async (project: Project): Promise<void> => {
    try {
      const result = await projectOps.updateProject(project.id, project);
      if (result) {
        setProjectList(prev => 
          prev.map(p => p.id === project.id ? result : p)
        );
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    try {
      await projectOps.deleteProject(id);
      setProjectList(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const uploadDocument = async (document: Partial<ProjectDocument>, file: File): Promise<ProjectDocument | undefined> => {
    return await documentOps.uploadDocument(document, file, documentList, setDocumentList, setDataModel);
  };

  const deleteDocument = async (id: string): Promise<void> => {
    return await documentOps.deleteDocument(id, documentList, setDocumentList);
  };

  // Fetch projects on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        console.log("Fetching initial data...");
        
        // Fetch projects
        const projects = await projectOps.fetchProjects();
        if (projects) {
          setProjectList(projects);
          
          // Fetch documents for all projects
          const allDocuments: ProjectDocument[] = [];
          for (const project of projects) {
            const documents = await documentOps.fetchDocuments(project.id);
            if (documents) {
              allDocuments.push(...documents);
            }
          }
          
          setDocumentList(allDocuments);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load initial data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

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
        getDocumentDataModel: dataModelOps.getDocumentDataModel,
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
