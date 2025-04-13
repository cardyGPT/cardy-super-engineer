
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, Database, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ProjectContextData } from '@/types/jira';

interface ContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectContext: string | null;
  selectedDocuments: string[];
  onSave: (projectId: string | null, documentIds: string[]) => Promise<void>;
  projectContextData: ProjectContextData | null;
}

interface ProjectOption {
  id: string;
  name: string;
  type: string;
}

interface DocumentOption {
  id: string;
  name: string;
  type: string;
}

const ContextDialog: React.FC<ContextDialogProps> = ({ 
  open, 
  onOpenChange, 
  projectContext, 
  selectedDocuments, 
  onSave,
  projectContextData 
}) => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectContext);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(selectedDocuments);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load projects and documents when dialog opens
  useEffect(() => {
    if (open) {
      loadProjectsAndDocuments();
      
      // Reset selection to current values when dialog opens
      setSelectedProject(projectContext);
      setSelectedDocs(selectedDocuments);
    }
  }, [open, projectContext, selectedDocuments]);
  
  const loadProjectsAndDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, type');
      
      if (projectsError) {
        console.error("Error loading projects:", projectsError);
        setError("Failed to load projects");
        return;
      }
      
      setProjects(projectsData || []);
      
      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, name, type');
      
      if (documentsError) {
        console.error("Error loading documents:", documentsError);
        setError("Failed to load documents");
        return;
      }
      
      setDocuments(documentsData || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    
    try {
      await onSave(selectedProject, selectedDocs);
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving context:", err);
      setError("Failed to save context settings");
    } finally {
      setSaving(false);
    }
  };
  
  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId === "none" ? null : projectId);
  };
  
  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocs(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Project Context
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 mb-4 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-select">Knowledge Project</Label>
            {loading ? (
              <div className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm animate-pulse">
                Loading projects...
              </div>
            ) : (
              <Select 
                value={selectedProject || "none"} 
                onValueChange={handleProjectChange}
              >
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="Select a knowledge project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project context</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Select a knowledge project to provide context for AI-generated content
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Referenced Documents</Label>
            {loading ? (
              <div className="h-20 w-full rounded-md border bg-background p-3 text-sm animate-pulse">
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="border rounded-md p-3 text-sm text-muted-foreground">
                No documents available
              </div>
            ) : (
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-start">
                    <Checkbox 
                      id={`doc-${doc.id}`}
                      checked={selectedDocs.includes(doc.id)}
                      onCheckedChange={() => handleDocumentToggle(doc.id)}
                      className="mt-1"
                    />
                    <Label 
                      htmlFor={`doc-${doc.id}`}
                      className="ml-2 text-sm font-normal cursor-pointer"
                    >
                      {doc.name}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({doc.type})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Select documents to provide additional context for AI-generated content
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : "Save Context"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContextDialog;
