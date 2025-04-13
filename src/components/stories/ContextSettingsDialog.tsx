import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ProjectContextData } from "@/types/jira";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Database, File, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface ContextSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectContext: string | null;
  selectedDocuments: string[];
  onSave: (projectId: string | null, documentIds: string[]) => Promise<void>;
  projectContextData: ProjectContextData | null;
}

const ContextSettingsDialog: React.FC<ContextSettingsDialogProps> = ({
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
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load projects and documents when dialog opens
  useEffect(() => {
    if (open) {
      loadProjects();
      setSelectedProject(projectContext);
      setSelectedDocs(selectedDocuments);
    }
  }, [open, projectContext, selectedDocuments]);

  // Load documents when a project is selected
  useEffect(() => {
    if (selectedProject) {
      loadDocuments(selectedProject);
    } else {
      setDocuments([]);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, type')
        .order('name');
      
      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects');
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, type')
        .eq('project_id', projectId)
        .order('name');
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedProject, selectedDocs);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving context:', err);
      toast({
        title: "Error",
        description: "Failed to save context settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectProject = (value: string) => {
    // Reset selected documents when changing projects
    if (value !== selectedProject) {
      setSelectedDocs([]);
    }
    setSelectedProject(value);
  };

  const handleToggleDocument = (id: string) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    );
  };

  const handleSelectAllDocuments = () => {
    if (documents.length === selectedDocs.length) {
      // If all are selected, deselect all
      setSelectedDocs([]);
    } else {
      // Otherwise select all
      setSelectedDocs(documents.map(doc => doc.id));
    }
  };

  const handleClearContext = () => {
    setSelectedProject(null);
    setSelectedDocs([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Project Context Settings
          </DialogTitle>
          <DialogDescription>
            Select a project and documents to use as context for story generation
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <div>
            <h3 className="text-lg font-medium">Select Project</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a project to use as context for AI generation
            </p>

            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <RadioGroup 
                value={selectedProject || ""} 
                onValueChange={handleSelectProject}
                className="space-y-2"
              >
                {projects.length === 0 ? (
                  <div className="text-muted-foreground text-sm py-2">
                    No projects available. Please add a project first.
                  </div>
                ) : (
                  projects.map(project => (
                    <div key={project.id} className="flex items-center space-x-2 border p-3 rounded-md">
                      <RadioGroupItem value={project.id} id={`project-${project.id}`} />
                      <Label htmlFor={`project-${project.id}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{project.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({project.type})</span>
                      </Label>
                    </div>
                  ))
                )}
              </RadioGroup>
            )}
          </div>

          {selectedProject && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Select Documents</h3>
                {documents.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectAllDocuments}
                  >
                    {documents.length === selectedDocs.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Choose documents to include in the context
              </p>

              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-56 border rounded-md p-2">
                  {documents.length === 0 ? (
                    <div className="text-muted-foreground text-sm p-4 text-center">
                      No documents available for this project
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map(doc => (
                        <div key={doc.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                          <Checkbox 
                            id={`doc-${doc.id}`} 
                            checked={selectedDocs.includes(doc.id)}
                            onCheckedChange={() => handleToggleDocument(doc.id)}
                          />
                          <Label htmlFor={`doc-${doc.id}`} className="flex items-center cursor-pointer flex-1">
                            <File className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{doc.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">({doc.type})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          )}

          {projectContextData && (
            <div>
              <Separator className="my-2" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Current Context</p>
                <p>Project: {projectContextData.project.name} ({projectContextData.project.type})</p>
                {projectContextData.documents.length > 0 && (
                  <div className="mt-1">
                    <p className="mb-1">Documents:</p>
                    <ul className="list-disc list-inside text-xs pl-2">
                      {projectContextData.documents.map(doc => (
                        <li key={doc.id}>{doc.name} ({doc.type})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="ghost" 
            onClick={handleClearContext}
            disabled={!selectedProject && selectedDocs.length === 0}
          >
            Clear Context
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save Context"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContextSettingsDialog;
