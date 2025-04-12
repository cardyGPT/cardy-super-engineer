
import { useState, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Database, FileUp, AlertTriangle } from "lucide-react";
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
import { DataModel } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DataModelPage = () => {
  const { projects, documents, getDocumentDataModel } = useProject();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(
    documents.find((doc) => doc.type === "data-model")?.id
  );
  const [currentDataModel, setCurrentDataModel] = useState<DataModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const dataModelDocuments = documents.filter(
    (doc) => doc.type === "data-model"
  );
  
  const selectedDocument = dataModelDocuments.find(
    (doc) => doc.id === selectedDocumentId
  );
  
  // Load the selected data model
  useEffect(() => {
    if (selectedDocumentId) {
      try {
        const model = getDocumentDataModel(selectedDocumentId);
        if (model) {
          setCurrentDataModel(model);
          setError(null);
        } else {
          setError("Could not load data model. The file may be corrupted or in an incorrect format.");
          setCurrentDataModel(null);
        }
      } catch (err) {
        console.error("Error loading data model:", err);
        setError("An error occurred while loading the data model.");
        setCurrentDataModel(null);
      }
    } else {
      setCurrentDataModel(null);
    }
  }, [selectedDocumentId, getDocumentDataModel]);
  
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };
  
  const handleDocumentChange = (docId: string) => {
    setSelectedDocumentId(docId);
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
                    onUploadComplete={() => {
                      // Refresh the selected document to the latest uploaded one
                      const latestDoc = documents
                        .filter(doc => doc.type === "data-model")
                        .sort((a, b) => 
                          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                        )[0];
                      if (latestDoc) {
                        setSelectedDocumentId(latestDoc.id);
                      }
                    }}
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
                      Upload a JSON file containing your data model.
                    </DialogDescription>
                  </DialogHeader>
                  <DocumentUpload 
                    projectId={projects[0]?.id || ""}
                    onUploadComplete={() => {
                      const latestDoc = documents
                        .filter(doc => doc.type === "data-model")
                        .sort((a, b) => 
                          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                        )[0];
                      if (latestDoc) {
                        setSelectedDocumentId(latestDoc.id);
                      }
                    }}
                  />
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
              {error && (
                <Alert variant="destructive" className="m-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {selectedDocument && currentDataModel ? (
                <ERDiagramViewer dataModel={currentDataModel} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">
                    {selectedDocument 
                      ? "Loading data model..." 
                      : "Select a data model to view its ER diagram"}
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
