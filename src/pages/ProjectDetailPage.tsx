
import { useParams, useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar,
  Edit, 
  Trash2 
} from "lucide-react";
import { format, isValid } from "date-fns";
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
import { useToast } from "@/hooks/use-toast";

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, documents, deleteProject, updateProject } = useProject();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const project = projects.find((p) => p.id === projectId);
  const projectDocuments = documents.filter((d) => d.projectId === projectId);
  
  if (!project) {
    return (
      <AppLayout>
        <div className="container mx-auto">
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
    toast({
      title: "Project Deleted",
      description: `Project "${project.name}" has been successfully deleted.`,
      variant: "success"
    });
    navigate("/projects");
  };
  
  const handleProjectUpdate = (updatedProject) => {
    updateProject(updatedProject);
    toast({
      title: "Project Updated",
      description: `Project "${updatedProject.name}" has been successfully updated.`,
      variant: "success"
    });
  };
  
  const hasDataModel = projectDocuments.some((doc) => doc.type === "data-model");
  const dataModelDoc = projectDocuments.find(doc => doc.type === "data-model");

  // Safely format dates with validation
  const formatDateSafe = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        console.warn("Invalid date detected:", dateString);
        return "Unknown date";
      }
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto">
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
                <span>Created {formatDateSafe(project.createdAt)}</span>
                <span className="mx-2">•</span>
                <span>Last updated {formatDateSafe(project.updatedAt)}</span>
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
                    onSuccess={handleProjectUpdate}
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
              Documents
            </TabsTrigger>
            <TabsTrigger value="data-model" disabled={!hasDataModel}>
              Data Model
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Project Documents</h2>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          Upload Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Document</DialogTitle>
                          <DialogDescription>
                            Select a document to upload to this project.
                          </DialogDescription>
                        </DialogHeader>
                        <DocumentUpload 
                          projectId={project.id}
                          onSuccess={() => {
                            toast({
                              title: "Document Uploaded",
                              description: "Your document has been successfully uploaded to the project.",
                              variant: "success"
                            });
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <DocumentList projectId={project.id} />
                </div>
              </div>
              
              <div>
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-xl font-semibold mb-4">Project Information</h2>
                  <dl className="divide-y divide-gray-100">
                    <div className="py-2 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{project.name}</dd>
                    </div>
                    <div className="py-2 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{project.type}</dd>
                    </div>
                    <div className="py-2 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {formatDateSafe(project.createdAt)}
                      </dd>
                    </div>
                    <div className="py-2 grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Documents</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {projectDocuments.length}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="data-model" className="mt-0">
            <div className="bg-white rounded-lg border overflow-hidden">
              <h2 className="text-xl font-semibold p-6 border-b">Data Model Viewer</h2>
              {hasDataModel ? (
                <div className="p-6">
                  <div className="mb-4">
                    <Button onClick={() => navigate("/data-models")}>
                      View Full ER Diagram
                    </Button>
                  </div>
                  
                  {dataModelDoc && (
                    <div className="border rounded-md p-4 bg-gray-50">
                      <h3 className="text-md font-medium mb-2">Data Model: {dataModelDoc.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Uploaded on {formatDateSafe(dataModelDoc.uploadedAt)}
                      </p>
                      
                      <div className="overflow-x-auto">
                        <pre className="text-xs bg-gray-100 p-4 rounded">
                          {JSON.stringify(dataModelDoc.content, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500 mb-4">
                    No data model uploaded for this project yet.
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
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
                        onSuccess={() => {
                          toast({
                            title: "Data Model Uploaded",
                            description: "Your data model has been successfully uploaded.",
                            variant: "success"
                          });
                        }}
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
