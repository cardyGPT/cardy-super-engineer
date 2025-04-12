
import { Project } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileUp, Database } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";
import { useProject } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

const ProjectCard = ({ project, onEdit }: ProjectCardProps) => {
  const { deleteProject } = useProject();
  const navigate = useNavigate();
  
  const handleView = () => {
    navigate(`/projects/${project.id}`);
  };
  
  const handleUploadDocuments = () => {
    navigate(`/projects/${project.id}/documents`);
  };
  
  const handleViewDataModel = () => {
    navigate(`/projects/${project.id}/data-model`);
  };
  
  const handleDelete = () => {
    deleteProject(project.id);
  };

  // Format the updated date with validation
  const getFormattedDate = () => {
    if (!project.updatedAt) return "Recently";
    
    try {
      const date = new Date(project.updatedAt);
      return isValid(date) 
        ? formatDistanceToNow(date, { addSuffix: true })
        : "Recently";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Recently";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
            <CardDescription>
              Updated {getFormattedDate()}
            </CardDescription>
          </div>
          <Badge variant="outline">{project.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 line-clamp-3">{project.details}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleView}>
            View
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(project)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleUploadDocuments}>
            <FileUp className="h-4 w-4 mr-1" /> Docs
          </Button>
          <Button size="sm" variant="outline" onClick={handleViewDataModel}>
            <Database className="h-4 w-4 mr-1" /> Data
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the project and all associated documents. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
