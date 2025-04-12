
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import AppLayout from "@/components/layout/AppLayout";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectForm from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Project } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ProjectsPage = () => {
  const { projects } = useProject();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
  };

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
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new project
                  </DialogDescription>
                </DialogHeader>
                <ProjectForm onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
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
