
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Database, FileText, RefreshCw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { ProjectContextData } from '@/types/jira';

interface ContextSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectContext: string | null;
  selectedDocuments: string[];
  onSave: (projectId: string | null, documentIds: string[]) => void;
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
  const [projectsForContext, setProjectsForContext] = useState<any[]>([]);
  const [selectedProjectContext, setSelectedProjectContext] = useState<string | null>(projectContext);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(selectedDocuments);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProjectsForContext();
      if (projectContext) {
        setSelectedProjectContext(projectContext);
        fetchDocumentsForProject(projectContext);
      }
      setSelectedDocs(selectedDocuments);
    }
  }, [open, projectContext, selectedDocuments]);

  const fetchProjectsForContext = async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, type')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setProjectsForContext(data);
      }
    } catch (err: any) {
      console.error("Error fetching projects for context:", err);
      toast({
        title: "Error",
        description: "Failed to load projects for context",
        variant: "destructive"
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchDocumentsForProject = async (projectId: string) => {
    setLoadingDocuments(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, type, file_type')
        .eq('project_id', projectId)
        .order('name');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setAvailableDocuments(data);
      }
    } catch (err: any) {
      console.error("Error fetching documents:", err);
      toast({
        title: "Error",
        description: "Failed to load project documents",
        variant: "destructive"
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleProjectContextChange = (projectId: string) => {
    setSelectedProjectContext(projectId);
    setSelectedDocs([]);
    fetchDocumentsForProject(projectId);
  };

  const handleDocumentSelectionChange = (documentId: string) => {
    setSelectedDocs(prevSelected => {
      if (prevSelected.includes(documentId)) {
        return prevSelected.filter(id => id !== documentId);
      } else {
        return [...prevSelected, documentId];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedProjectContext, selectedDocs);
      toast({
        title: "Context Saved",
        description: "Project context settings have been saved",
        variant: "success"
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving context:", error);
      toast({
        title: "Error",
        description: "Failed to save context settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDocumentTypeLabel = (fileType: string | null, type: string) => {
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType?.includes('json')) return 'JSON';
    if (fileType?.includes('document')) return 'DOC';
    return type || 'Document';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Project Context Settings
          </DialogTitle>
          <DialogDescription>
            Select project and documents to enhance artifact generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="context-project-select" className="text-sm font-medium">
              Project for Context
            </label>
            {loadingProjects ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : projectsForContext.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Projects Found</AlertTitle>
                <AlertDescription>
                  No projects available for context. Create a project first.
                </AlertDescription>
              </Alert>
            ) : (
              <Select 
                value={selectedProjectContext || ""} 
                onValueChange={handleProjectContextChange}
                disabled={loadingProjects || projectsForContext.length === 0}
              >
                <SelectTrigger id="context-project-select" className="w-full">
                  <SelectValue placeholder="Select a project for context" />
                </SelectTrigger>
                <SelectContent>
                  {projectsForContext.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {selectedProjectContext && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Documents for Context
              </label>
              {loadingDocuments ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : availableDocuments.length === 0 ? (
                <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                  No documents available for this project. Upload documents in the Documents page.
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                  {availableDocuments.map(doc => (
                    <div key={doc.id} className="flex items-start space-x-2">
                      <Checkbox 
                        id={`doc-${doc.id}`} 
                        checked={selectedDocs.includes(doc.id)}
                        onCheckedChange={() => handleDocumentSelectionChange(doc.id)}
                      />
                      <label 
                        htmlFor={`doc-${doc.id}`} 
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {doc.name}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({getDocumentTypeLabel(doc.file_type, doc.type)})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {selectedDocs.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || (!selectedProjectContext && selectedDocs.length === 0)}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save Context
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContextSettingsDialog;
