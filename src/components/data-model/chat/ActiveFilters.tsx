
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ActiveFiltersProps {
  selectedProjects: string[];
  selectedProjectTypes: string[];
  selectedProjectDocs: string[];
  onRemoveProject: (project: string) => void;
  onRemoveProjectType: (type: string) => void;
  onRemoveProjectDoc: (doc: string) => void;
  onClearAllFilters: () => void;
}

const ActiveFilters = ({
  selectedProjects,
  selectedProjectTypes,
  selectedProjectDocs,
  onRemoveProject,
  onRemoveProjectType,
  onRemoveProjectDoc,
  onClearAllFilters
}: ActiveFiltersProps) => {
  const hasFilters = selectedProjects.length > 0 || selectedProjectTypes.length > 0 || selectedProjectDocs.length > 0;
  
  if (!hasFilters) return null;
  
  return (
    <div className="bg-slate-50 p-2 rounded-md mb-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-slate-700">Active filters:</h3>
        <Button variant="ghost" size="sm" onClick={onClearAllFilters} className="h-6 px-2 text-xs">
          Clear all
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {selectedProjects.map(proj => (
          <Badge key={`proj-${proj}`} variant="outline" className="text-xs">
            {proj}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => onRemoveProject(proj)}
            />
          </Badge>
        ))}
        {selectedProjectTypes.map(type => (
          <Badge key={`type-${type}`} variant="secondary" className="text-xs">
            {type}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => onRemoveProjectType(type)}
            />
          </Badge>
        ))}
        {selectedProjectDocs.map(doc => (
          <Badge key={`doc-${doc}`} variant="default" className="text-xs text-primary-foreground">
            {doc}
            <X 
              className="h-3 w-3 ml-1 cursor-pointer" 
              onClick={() => onRemoveProjectDoc(doc)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ActiveFilters;
