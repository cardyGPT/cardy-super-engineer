
import { useState, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { Project } from "@/types";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectForm from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, LayoutGrid, LayoutList } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ProjectsPage = () => {
  const { projects, loading: projectsLoading, addProject } = useProject();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    // When projects are loaded from context, set loading to false
    if (!projectsLoading) {
      setIsLoading(false);
    }
  }, [projects, projectsLoading]);

  const handleDialogOpen = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
  };

  const handleCreateProject = async (formData: Partial<Project>) => {
    setIsSubmitting(true);
    try {
      const newProject = await addProject(formData);
      if (newProject) {
        toast({
          title: "Success",
          description: "Project created successfully!",
        });
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Projects</h1>
          <div className="flex items-center gap-4">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "grid" | "list")}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <LayoutList className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleDialogOpen}>
                  <Plus className="h-4 w-4 mr-2" /> Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
                  <DialogDescription>
                    {editingProject 
                      ? "Update project details below." 
                      : "Fill in the project details to create a new project."}
                  </DialogDescription>
                </DialogHeader>
                <ProjectForm
                  initialData={editingProject || undefined}
                  onSuccess={handleCreateProject}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.type}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditProject(project)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.location.href = `/projects/${project.id}`}>
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-md">
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to get started.
            </p>
            <Button onClick={handleDialogOpen}>
              <Plus className="h-4 w-4 mr-2" /> Add Project
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ProjectsPage;
