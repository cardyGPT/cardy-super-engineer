
import { useState } from "react";
import { Project, ProjectType } from "@/types";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ProjectFormProps {
  initialData?: Project;
  onSuccess?: (project: Partial<Project>) => void;
  isSubmitting?: boolean;
}

const PROJECT_TYPES: ProjectType[] = [
  "Child Welfare",
  "Child Support",
  "Juvenile Justice"
];

const ProjectForm = ({ initialData, onSuccess, isSubmitting = false }: ProjectFormProps) => {
  const { updateProject } = useProject();
  const [formData, setFormData] = useState<Partial<Project>>(
    initialData || {
      name: "",
      type: "Child Welfare",
      details: "",
      bitbucket_url: "",
      google_drive_url: "",
      jira_url: ""
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as ProjectType }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      return; // Basic validation
    }
    
    if (initialData && initialData.id) {
      await updateProject({ ...initialData, ...formData });
    } else if (onSuccess) {
      onSuccess(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter project name"
          required
          disabled={isSubmitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">Project Type</Label>
        <Select
          value={formData.type}
          onValueChange={handleSelectChange}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select project type" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="details">Project Details</Label>
        <Textarea
          id="details"
          name="details"
          value={formData.details || ""}
          onChange={handleChange}
          placeholder="Enter project details"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Reference Links</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor="bitbucket_url">Bitbucket URL</Label>
            <Input
              id="bitbucket_url"
              name="bitbucket_url"
              value={formData.bitbucket_url || ""}
              onChange={handleChange}
              placeholder="https://bitbucket.org/your-repo"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="google_drive_url">Google Drive URL</Label>
            <Input
              id="google_drive_url"
              name="google_drive_url"
              value={formData.google_drive_url || ""}
              onChange={handleChange}
              placeholder="https://drive.google.com/drive/folders/your-folder"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="jira_url">Jira URL</Label>
            <Input
              id="jira_url"
              name="jira_url"
              value={formData.jira_url || ""}
              onChange={handleChange}
              placeholder="https://your-domain.atlassian.net/projects/your-project"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button 
          type="submit" 
          className="w-full md:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {initialData ? "Updating..." : "Creating..."}
            </>
          ) : (
            initialData ? "Update Project" : "Create Project"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ProjectForm;
