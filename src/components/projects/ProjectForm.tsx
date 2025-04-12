
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

interface ProjectFormProps {
  initialData?: Project;
  onSuccess?: () => void;
}

const PROJECT_TYPES: ProjectType[] = [
  "Child Welfare",
  "Child Support",
  "Juvenile Justice"
];

const ProjectForm = ({ initialData, onSuccess }: ProjectFormProps) => {
  const { addProject, updateProject } = useProject();
  const [formData, setFormData] = useState<Partial<Project>>(
    initialData || {
      name: "",
      type: "Child Welfare",
      details: ""
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      return; // Basic validation
    }
    
    if (initialData) {
      updateProject({ ...initialData, ...formData });
    } else {
      addProject(formData);
    }
    
    if (onSuccess) {
      onSuccess();
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
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">Project Type</Label>
        <Select
          value={formData.type}
          onValueChange={handleSelectChange}
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
          value={formData.details}
          onChange={handleChange}
          placeholder="Enter project details"
          rows={5}
        />
      </div>
      
      <DialogFooter>
        <Button type="submit" className="w-full md:w-auto">
          {initialData ? "Update Project" : "Create Project"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ProjectForm;
