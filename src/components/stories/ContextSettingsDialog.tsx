
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Database, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ProjectContextData } from '@/types/jira';

interface ContextSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectContext: string | null;
  selectedDocuments: string[];
  onSave: (projectId: string | null, documentIds: string[]) => Promise<void>;
  projectContextData?: ProjectContextData | null;
}

const ContextSettingsDialog: React.FC<ContextSettingsDialogProps> = ({
  open,
  onOpenChange,
  projectContext,
  selectedDocuments,
  onSave,
  projectContextData
}) => {
  const [projects, setProjects] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load available projects and documents when dialog opens
  useEffect(() => {
    const loadProjectsAndDocs = async () => {
      setIsLoading(true);
      try {
        // Load projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, type')
          .order('name');
        
        if (projectsError) throw projectsError;
        
        setProjects(projectsData || []);
        
        // Initialize selected project
        if (projectContext && !selectedProject) {
          setSelectedProject(projectContext);
        }
        
        // Initialize selected documents
        if (selectedDocuments.length > 0 && selectedDocs.length === 0) {
          setSelectedDocs([...selectedDocuments]);
        }
        
        // Load documents for the selected project
        if (projectContext || selectedProject) {
          const projectId = selectedProject || projectContext;
          
          const { data: docsData, error: docsError } = await supabase
            .from('documents')
            .select('id, name, type')
            .eq('project_id', projectId)
            .order('name');
          
          if (docsError) throw docsError;
          
          setDocuments(docsData || []);
        }
      } catch (error) {
        console.error('Error loading projects or documents:', error);
        toast({
          title: "Error",
          description: "Failed to load projects or documents",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open) {
      loadProjectsAndDocs();
    }
  }, [open, projectContext, selectedDocuments, selectedProject, toast]);

  // Load documents when selected project changes
  useEffect(() => {
    const loadDocuments = async () => {
      if (!selectedProject) {
        setDocuments([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, name, type')
          .eq('project_id', selectedProject)
          .order('name');
        
        if (error) throw error;
        
        setDocuments(data || []);
        
        // Clear selected docs if they don't belong to this project
        setSelectedDocs(prev => prev.filter(docId => 
          data?.some(d => d.id === docId)
        ));
      } catch (error) {
        console.error('Error loading documents:', error);
        toast({
          title: "Error",
          description: "Failed to load documents for this project",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedProject) {
      loadDocuments();
    }
  }, [selectedProject, toast]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleDocumentToggle = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocs(prev => [...prev, docId]);
    } else {
      setSelectedDocs(prev => prev.filter(id => id !== docId));
    }
  };

  const handleSaveContext = async () => {
    setIsLoading(true);
    try {
      await onSave(selectedProject, selectedDocs);
      toast({
        title: "Context Saved",
        description: "Project context has been updated successfully"
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving context:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save context",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearContext = async () => {
    setIsLoading(true);
    try {
      await onSave(null, []);
      setSelectedProject(null);
      setSelectedDocs([]);
      toast({
        title: "Context Cleared",
        description: "Project context has been cleared"
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error clearing context:', error);
      toast({
        title: "Error",
        description: "Failed to clear context",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Project Context Settings
          </DialogTitle>
          <DialogDescription>
            Select project and documents to enhance artifact generation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-2">
          <div className="space-y-2">
            <Label>Project for Context</Label>
            <Select value={selectedProject || ""} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedProject && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="flex-1">Documents for Context</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedDocs.length} selected
                </span>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground border rounded-md">
                  No documents available for this project
                </div>
              ) : (
                <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`doc-${doc.id}`} 
                        checked={selectedDocs.includes(doc.id)}
                        onCheckedChange={checked => handleDocumentToggle(doc.id, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`doc-${doc.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {doc.name} <span className="text-xs text-muted-foreground">({doc.type})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleClearContext}
            disabled={isLoading || (!selectedProject && selectedDocs.length === 0)}
          >
            <X className="h-4 w-4 mr-1" />
            Clear Context
          </Button>
          <Button 
            onClick={handleSaveContext}
            disabled={isLoading || !selectedProject}
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-b-2 mr-1"></span>
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Context
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContextSettingsDialog;
