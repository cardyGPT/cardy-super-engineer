import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RefreshCw, Settings, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ProjectContextData } from "@/types/jira";

// Components
import StoryList from "@/components/stories/StoryList";
import StoryDetails from "@/components/stories/StoryDetails";
import JiraProjectSelector from "@/components/stories/JiraProjectSelector";
import ContextBanner from "@/components/stories/ContextBanner";
import ContextDialog from "@/components/stories/ContextDialog";
import NotConnectedCard from "@/components/stories/NotConnectedCard";

const StoriesPage: React.FC = () => {
  const { isAuthenticated, loading, refreshAll, error } = useStories();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const [selectedProjectContext, setSelectedProjectContext] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [projectContextData, setProjectContextData] = useState<ProjectContextData | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Load saved context on initial page load
  useEffect(() => {
    loadSavedContext();
  }, []);
  
  // Show toast for any errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  const loadSavedContext = async () => {
    try {
      const { data, error } = await supabase
        .from('project_context')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Error loading saved context:", error);
        return;
      }
      
      if (data) {
        setSelectedProjectContext(data.project_id);
        setSelectedDocuments(data.document_ids || []);
        
        await loadProjectContextData(data.project_id, data.document_ids || []);
      }
    } catch (err) {
      console.error("Error loading saved context:", err);
    }
  };
  
  const loadProjectContextData = async (projectId: string, documentIds: string[]) => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name, type')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        console.error("Error loading project data:", projectError);
        return;
      }
      
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, name, type')
        .in('id', documentIds);
      
      if (documentsError) {
        console.error("Error loading document data:", documentsError);
        return;
      }
      
      setProjectContextData({
        project: projectData,
        documents: documentsData || []
      });
    } catch (err) {
      console.error("Error loading project context data:", err);
    }
  };
  
  const handleSaveContext = async (projectId: string | null, documentIds: string[]) => {
    try {
      const { error } = await supabase.functions.invoke('save-context', {
        body: {
          projectId,
          documentIds
        }
      });
      
      if (error) {
        console.error("Error saving context:", error);
        throw new Error("Failed to save context settings");
      }
      
      setSelectedProjectContext(projectId);
      setSelectedDocuments(documentIds);
      
      if (projectId) {
        await loadProjectContextData(projectId, documentIds);
        
        toast({
          title: "Context Saved",
          description: "Project context has been updated successfully"
        });
      } else {
        setProjectContextData(null);
        
        toast({
          title: "Context Cleared",
          description: "Project context has been cleared"
        });
      }
    } catch (err: any) {
      console.error("Error saving context:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save context",
        variant: "destructive"
      });
    }
  };
  
  const handleRefresh = async () => {
    if (isRefreshing || loading) return;
    
    setIsRefreshing(true);
    try {
      await refreshAll();
      setLastRefreshTime(new Date());
      
      toast({
        title: "Refreshed",
        description: "Jira data has been refreshed successfully"
      });
    } catch (err) {
      console.error("Error refreshing:", err);
      toast({
        title: "Error",
        description: "Failed to refresh Jira data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Jira Stories</h1>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsContextDialogOpen(true)}
            >
              <Database className="h-4 w-4 mr-2" />
              Context
            </Button>
            
            {isAuthenticated && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={loading || isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                {(loading || isRefreshing) ? 'Loading...' : 'Refresh'}
              </Button>
            )}
            
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
        
        {projectContextData && (
          <ContextBanner 
            contextData={projectContextData} 
            onEdit={() => setIsContextDialogOpen(true)}
          />
        )}

        {!isAuthenticated ? (
          <NotConnectedCard />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <JiraProjectSelector lastRefreshTime={lastRefreshTime} />
              <StoryList />
            </div>
            
            <div className="space-y-4">
              <StoryDetails 
                projectContext={selectedProjectContext} 
                selectedDocuments={selectedDocuments}
                projectContextData={projectContextData}
              />
            </div>
          </div>
        )}
      </div>
      
      <ContextDialog 
        open={isContextDialogOpen}
        onOpenChange={setIsContextDialogOpen}
        projectContext={selectedProjectContext}
        selectedDocuments={selectedDocuments}
        onSave={handleSaveContext}
        projectContextData={projectContextData}
      />
    </AppLayout>
  );
};

export default StoriesPage;
