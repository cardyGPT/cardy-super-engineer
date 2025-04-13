
import { useState, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Database, FileUp, AlertTriangle, Info, MessageSquare, Maximize2, Minimize2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentUpload from "@/components/documents/DocumentUpload";
import ERDiagramFlow from "@/components/data-model/ERDiagramFlow";
import AIModelChat from "@/components/data-model/AIModelChat";
import { DataModel, Entity } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import LoadingContent from "@/components/stories/LoadingContent";

const DataModelPage = () => {
  const {
    projects,
    documents,
    getDocumentDataModel
  } = useProject();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(documents.find(doc => doc.type === "data-model")?.id);
  const [currentDataModel, setCurrentDataModel] = useState<DataModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("diagram");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const { toast } = useToast();

  const dataModelDocuments = documents.filter(doc => doc.type === "data-model");
  console.log("Data model documents:", dataModelDocuments);
  const selectedDocument = dataModelDocuments.find(doc => doc.id === selectedDocumentId);
  const projectDocuments = documents.filter(doc => selectedDocument && doc.projectId === selectedDocument.projectId);

  useEffect(() => {
    console.log("Selected document ID changed:", selectedDocumentId);
    if (selectedDocumentId) {
      try {
        const model = getDocumentDataModel(selectedDocumentId);
        console.log("Loaded data model:", model);
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
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  const handleDocumentChange = (docId: string) => {
    setSelectedDocumentId(docId);
    setSelectedEntity(null);
  };

  const handleUploadComplete = () => {
    console.log("Upload complete, refreshing data models...");
    setUploadDialogOpen(false);

    const latestDoc = documents.filter(doc => doc.type === "data-model").sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
    if (latestDoc) {
      console.log("Setting selected document to latest:", latestDoc.id);
      setSelectedDocumentId(latestDoc.id);
      toast({
        title: "Data model uploaded",
        description: `${latestDoc.name} has been uploaded and selected.`
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleEntitySelect = (entity: Entity | null) => {
    setSelectedEntity(entity);
  };

  const renderContent = () => {
    if (dataModelDocuments.length === 0) {
      return (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Database className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No data models found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            {projects.length === 0 ? "Create a project first before uploading data models" : "Upload a JSON data model file to visualize your entity relationships"}
          </p>
          {projects.length > 0 && <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
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
                <DocumentUpload projectId={projects[0]?.id || ""} onUploadComplete={handleUploadComplete} />
              </DialogContent>
            </Dialog>}
        </div>
      );
    }

    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'bg-white rounded-lg border'} flex flex-col`}
           style={{ height: isFullscreen ? '100vh' : 'calc(100vh-12rem)' }}>
        <div className="p-4 bg-muted border-b flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex items-center gap-4">
            {!isFullscreen && (
              // Removed the Tabs component and just use an h2 title
              <h2 className="text-lg font-medium">Cardy ER360</h2>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            <label htmlFor="model-select" className="text-sm">
              Data Model:
            </label>
            <Select value={selectedDocumentId} onValueChange={handleDocumentChange}>
              <SelectTrigger id="model-select" className="w-[250px]">
                <SelectValue placeholder="Select a data model" />
              </SelectTrigger>
              <SelectContent>
                {dataModelDocuments.map(doc => <SelectItem key={doc.id} value={doc.id}>
                    {doc.name} ({getProjectName(doc.projectId)})
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {error && <Alert variant="destructive" className="m-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>}
          
          {isFullscreen ? (
            selectedDocument && currentDataModel ? (
              <div className="h-full w-full flex flex-col">
                <div className="flex-1 overflow-auto h-[calc(100vh-120px)]">
                  <ERDiagramFlow dataModel={currentDataModel} onEntitySelect={handleEntitySelect} />
                </div>
                <div className="absolute bottom-4 right-4">
                  <Button onClick={exitFullscreen} variant="outline" className="shadow-md">
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-4">
                {selectedDocument ? (
                  <LoadingContent 
                    message="Loading data model..." 
                    count={6}
                    isInfo={true}
                  />
                ) : (
                  <>
                    <p className="text-gray-500">
                      Select a data model to view its ER diagram
                    </p>
                    
                    {!selectedDocument && dataModelDocuments.length > 0 && <Button variant="outline" onClick={() => setSelectedDocumentId(dataModelDocuments[0].id)}>
                        <Database className="h-4 w-4 mr-2" />
                        Load First Data Model
                      </Button>}
                  </>
                )}
              </div>
            )
          ) : (
            // Instead of Tabs, just show the ER Diagram directly
            <div className="h-full">
              {selectedDocument && currentDataModel ? (
                <ERDiagramFlow dataModel={currentDataModel} onEntitySelect={handleEntitySelect} />
              ) : (
                <div className="h-full flex items-center justify-center flex-col gap-4">
                  {selectedDocument ? (
                    <LoadingContent 
                      message="Loading data model..." 
                      count={6}
                      isInfo={true}
                    />
                  ) : (
                    <>
                      <p className="text-gray-500">
                        Select a data model to view its ER diagram
                      </p>
                      
                      {!selectedDocument && dataModelDocuments.length > 0 && <Button variant="outline" onClick={() => setSelectedDocumentId(dataModelDocuments[0].id)}>
                          <Database className="h-4 w-4 mr-2" />
                          Load First Data Model
                        </Button>}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {selectedEntity && (
          <div className="bg-white p-4 border-t">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold mb-2">Selected Entity: {selectedEntity.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEntity(null)}
                className="h-8 px-2"
              >
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium mb-1">Definition</h4>
                <p className="text-sm">{selectedEntity.definition || "No definition provided"}</p>
                
                <h4 className="text-xs font-medium mt-3 mb-1">Attributes</h4>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-center">Required</th>
                        <th className="px-2 py-1 text-center">Key</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEntity.attributes.map(attr => (
                        <tr key={attr.id} className="border-t">
                          <td className="px-2 py-1 font-medium">{attr.name}</td>
                          <td className="px-2 py-1">{attr.type}</td>
                          <td className="px-2 py-1 text-center">{attr.required ? "✓" : ""}</td>
                          <td className="px-2 py-1 text-center">
                            {attr.isPrimaryKey ? "PK" : ""}
                            {attr.isForeignKey ? "FK" : ""}
                          </td>
                        </tr>
                      ))}
                      {selectedEntity.attributes.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-2 py-3 text-center text-gray-500">
                            No attributes defined
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium mb-1">Relationships</h4>
                {currentDataModel && (
                  <div className="space-y-2">
                    {currentDataModel.relationships
                      .filter(rel => rel.sourceEntityId === selectedEntity.id || rel.targetEntityId === selectedEntity.id)
                      .map(rel => {
                        const isSource = rel.sourceEntityId === selectedEntity.id;
                        const otherEntityId = isSource ? rel.targetEntityId : rel.sourceEntityId;
                        const otherEntity = currentDataModel.entities.find(e => e.id === otherEntityId);
                        
                        return (
                          <div key={rel.id} className="border rounded p-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">{rel.name || `Relation with ${otherEntity?.name || 'Unknown'}`}</span>
                              <Badge variant="outline">
                                {isSource ? `${rel.sourceCardinality}:${rel.targetCardinality}` : `${rel.targetCardinality}:${rel.sourceCardinality}`}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {isSource ? 'From' : 'To'} <span className="font-medium">{selectedEntity.name}</span>
                              {' '}{isSource ? 'to' : 'from'}{' '}
                              <span className="font-medium">{otherEntity?.name || otherEntityId}</span>
                            </p>
                            {rel.description && (
                              <p className="text-xs mt-1">{rel.description}</p>
                            )}
                          </div>
                        );
                      })}
                    
                    {currentDataModel.relationships.filter(
                      rel => rel.sourceEntityId === selectedEntity.id || rel.targetEntityId === selectedEntity.id
                    ).length === 0 && (
                      <p className="text-sm text-gray-500">No relationships defined for this entity</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Data Models</h1>
            <p className="text-gray-500">
              Visualize, explore, and chat with your data models
            </p>
          </div>
          
          {projects.length > 0 && <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
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
                    JSON file must contain 'entities' and 'relationships' arrays. We support multiple formats, including object-based and array-based structures.
                  </DialogDescription>
                </DialogHeader>
                <DocumentUpload projectId={projects[0]?.id || ""} onUploadComplete={handleUploadComplete} />
              </DialogContent>
            </Dialog>}
        </div>
        
        {renderContent()}
      </div>
    </AppLayout>;
};

export default DataModelPage;
