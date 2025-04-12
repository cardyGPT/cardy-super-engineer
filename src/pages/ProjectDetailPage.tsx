
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar,
  Edit, 
  FileUp, 
  Database,
  Trash2 
} from "lucide-react";
import { format } from "date-fns";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import DocumentList from "@/components/documents/DocumentList";
import DocumentUpload from "@/components/documents/DocumentUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProjectForm from "@/components/projects/ProjectForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, documents, deleteProject } = useProject();
  const navigate = useNavigate();
  
  const project = projects.find((p) => p.id === projectId);
  const projectDocuments = documents.filter((d) => d.projectId === projectId);
  
  if (!project) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
            <p className="text-sm text-gray-500">
              The project you're looking for doesn't exist or has been deleted.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  const handleDeleteProject = () => {
    deleteProject(project.id);
    navigate("/projects");
  };
  
  const hasDataModel = projectDocuments.some((doc) => doc.type === "data-model");

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge>{project.type}</Badge>
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Created {format(new Date(project.createdAt), "MMMM d, yyyy")}</span>
                <span className="mx-2">•</span>
                <span>Last updated {format(new Date(project.updatedAt), "MMMM d, yyyy")}</span>
              </div>
              <p className="text-gray-700">{project.details}</p>
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                      Update the project details below
                    </DialogDescription>
                  </DialogHeader>
                  <ProjectForm
                    initialData={project}
                    onSuccess={() => {}}
                  />
                </DialogContent>
              </Dialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the project and all associated documents.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProject}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="documents">
              <FileUp className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="data-model" disabled={!hasDataModel}>
              <Database className="h-4 w-4 mr-2" />
              Data Model
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-xl font-semibold mb-4">Project Documents</h2>
                  <DocumentList projectId={project.id} />
                </div>
              </div>
              
              <div>
                <div className="bg-white rounded-lg border p-6 sticky top-6">
                  <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
                  <DocumentUpload projectId={project.id} />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="data-model" className="mt-0">
            <div className="bg-white rounded-lg border overflow-hidden">
              <h2 className="text-xl font-semibold p-6 border-b">Data Model Viewer</h2>
              {hasDataModel ? (
                <p className="p-6 text-center text-gray-500">
                  This will show the ER diagram when a data model is uploaded and selected.
                  Navigate to the Data Models page to view the full diagram.
                </p>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500 mb-4">
                    No data model uploaded for this project yet.
                  </p>
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
                          Upload a JSON file containing your data model.
                        </DialogDescription>
                      </DialogHeader>
                      <DocumentUpload
                        projectId={project.id}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProjectDetailPage;
