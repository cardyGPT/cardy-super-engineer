
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Database, FileUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DocumentUpload from "@/components/documents/DocumentUpload";
import ERDiagramViewer from "@/components/data-model/ERDiagramViewer";
import { ProjectDocument } from "@/types";
import { sampleDataModel } from "@/lib/mock-data";

const DataModelPage = () => {
  const { projects, documents, setDataModel } = useProject();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(
    documents.find((doc) => doc.type === "data-model")?.id
  );
  
  const dataModelDocuments = documents.filter(
    (doc) => doc.type === "data-model"
  );
  
  const selectedDocument = dataModelDocuments.find(
    (doc) => doc.id === selectedDocumentId
  );
  
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };
  
  const handleDocumentChange = (docId: string) => {
    setSelectedDocumentId(docId);
    
    // In a real app, we would fetch the document's content here
    // For this prototype, we'll just use our sample data model
    setDataModel(sampleDataModel);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Data Models</h1>
            <p className="text-gray-500">
              Visualize and explore entity-relationship diagrams
            </p>
          </div>
          
          {projects.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload Data Model
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Data Model</DialogTitle>
                  <DialogDescription>
                    Select a project to upload a data model JSON file
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="project" className="text-sm font-medium block mb-1">
                      Select Project
                    </label>
                    <Select defaultValue={projects[0]?.id}>
                      <SelectTrigger id="project">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DocumentUpload 
                    projectId={projects[0]?.id || ""}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {dataModelDocuments.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Database className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No data models found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              {projects.length === 0
                ? "Create a project first before uploading data models"
                : "Upload a JSON data model file to visualize your entity relationships"}
            </p>
            {projects.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload Data Model
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Data Model</DialogTitle>
                    <DialogDescription>
                      Select a project to upload a data model JSON file
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="project" className="text-sm font-medium block mb-1">
                        Select Project
                      </label>
                      <Select defaultValue={projects[0]?.id}>
                        <SelectTrigger id="project">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DocumentUpload 
                      projectId={projects[0]?.id || ""}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border h-[calc(100vh-12rem)] overflow-hidden">
            <div className="p-4 bg-muted border-b flex justify-between items-center">
              <div className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-gray-500" />
                <h2 className="text-lg font-semibold">ER Diagram Viewer</h2>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="model-select" className="text-sm">
                  Data Model:
                </label>
                <Select
                  value={selectedDocumentId}
                  onValueChange={handleDocumentChange}
                >
                  <SelectTrigger id="model-select" className="w-[250px]">
                    <SelectValue placeholder="Select a data model" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataModelDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name} ({getProjectName(doc.projectId)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="h-full">
              {selectedDocument ? (
                <ERDiagramViewer dataModel={sampleDataModel} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">
                    Select a data model to view its ER diagram
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DataModelPage;
