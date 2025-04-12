import React, { createContext, useState, useContext, useEffect } from "react";
import { Project, ProjectDocument, DataModel } from "@/types";
import { toast } from "@/hooks/use-toast"; 
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

  const { fetchProjects, addProject, updateProject, deleteProject } = 
    useProjectOperations(projectList, setProjectList, setLoading, toast);
    
  const { uploadDocument, deleteDocument } = 
    useDocumentOperations(documentList, setDocumentList, setDataModel, setLoading, toast);
    
  const { getDocumentDataModel } = 
    useDataModelOperations(documentList);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading initial data from Supabase");
        const result = await fetchProjects();
        
        if (!result) {
          console.log("No data returned from fetchProjects");
          return;
        }
        
        const { documents } = result;
        console.log("Loaded documents:", documents);
        
        if (documents && documents.length > 0) {
          const formattedDocs = documents.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            name: d.name,
            type: d.type,
            fileUrl: d.file_url,
            fileType: d.file_type,
            uploadedAt: d.uploaded_at,
            content: d.content,
          }));
          
          console.log("Formatted documents:", formattedDocs);
          setDocumentList(formattedDocs);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load initial data. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    
    loadData();
  }, [fetchProjects, toast]);

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
