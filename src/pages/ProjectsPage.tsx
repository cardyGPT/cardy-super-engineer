
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import AppLayout from "@/components/layout/AppLayout";
import ProjectForm from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, File, ArrowUpRight } from "lucide-react";
import { Project } from "@/types";
import ProjectCard from "@/components/projects/ProjectCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const ProjectsPage = () => {
  const { projects, addProject, deleteProject } = useProject();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // When projects are loaded from context, set loading to false
    if (projects.length > 0 || !useProject().loading) {
      setIsLoading(false);
    }
  }, [projects, useProject().loading]);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
  };

  const handleCreateProject = async (formData: Partial<Project>) => {
    try {
      const newProject = await addProject(formData);
      if (newProject) {
        toast({
          title: "Project created",
          description: `Project ${newProject.name} has been created successfully.`,
        });
        handleDialogClose();
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-500">Loading projects...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-gray-500">Manage your engineering projects</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? "Edit Project" : "Create New Project"}
                </DialogTitle>
                <DialogDescription>
                  {editingProject
                    ? "Update the project details below"
                    : "Fill in the details to create a new project"}
                </DialogDescription>
              </DialogHeader>
              <ProjectForm
                initialData={editingProject || undefined}
                onSuccess={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-dashed">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No projects</h3>
            <p className="text-sm text-gray-500 mb-6">
              Get started by creating a new project
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onEdit={handleEditProject} 
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ProjectsPage;
