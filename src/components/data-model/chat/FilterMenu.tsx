
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProjectDocument } from "@/types";
import { useProject } from "@/contexts/ProjectContext";

interface FilterMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjects: string[];
  setSelectedProjects: React.Dispatch<React.SetStateAction<string[]>>;
  selectedProjectTypes: string[];
  setSelectedProjectTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedProjectDocs: string[];
  setSelectedProjectDocs: React.Dispatch<React.SetStateAction<string[]>>;
  clearAllFilters: () => void;
  triggerElement: React.ReactNode;
  documents: ProjectDocument[];
}

const FilterMenu = ({
  isOpen,
  onOpenChange,
  selectedProjects,
  setSelectedProjects,
  selectedProjectTypes,
  setSelectedProjectTypes,
  selectedProjectDocs,
  setSelectedProjectDocs,
  clearAllFilters,
  triggerElement,
  documents
}: FilterMenuProps) => {
  const { projects } = useProject();
  
  // Get unique project types
  const projectTypes = Array.from(new Set(projects.map(p => p.type)));

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {triggerElement}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Projects</h4>
            <div className="space-y-2">
              {projects.map(project => (
                <div key={project.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`project-${project.id}`}
                    checked={selectedProjects.includes(project.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProjects(prev => [...prev, project.name]);
                      } else {
                        setSelectedProjects(prev => prev.filter(p => p !== project.name));
                      }
                    }}
                  />
                  <label htmlFor={`project-${project.id}`} className="text-sm">{project.name}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Project Types</h4>
            <div className="space-y-2">
              {projectTypes.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type}`}
                    checked={selectedProjectTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProjectTypes(prev => [...prev, type]);
                      } else {
                        setSelectedProjectTypes(prev => prev.filter(t => t !== type));
                      }
                    }}
                  />
                  <label htmlFor={`type-${type}`} className="text-sm">{type}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Project Documents</h4>
            <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
              {documents.filter(doc => doc.type !== "data-model").map(doc => (
                <div key={doc.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`doc-${doc.id}`}
                    checked={selectedProjectDocs.includes(doc.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProjectDocs(prev => [...prev, doc.name]);
                      } else {
                        setSelectedProjectDocs(prev => prev.filter(d => d !== doc.name));
                      }
                    }}
                  />
                  <label htmlFor={`doc-${doc.id}`} className="text-sm truncate">{doc.name}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FilterMenu;
