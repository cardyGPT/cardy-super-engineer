
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ProjectContextData } from "@/types/jira";
import { ContentType } from "@/components/stories/ContentDisplay";
import StoryDetailWrapper from "@/components/stories/StoryDetailWrapper";

// Components
import StoryList from "@/components/stories/StoryList";
import JiraProjectSelector from "@/components/stories/JiraProjectSelector";
import ContextDialog from "@/components/stories/ContextDialog";
import NotConnectedCard from "@/components/stories/NotConnectedCard";

const GeneratePage: React.FC = () => {
  const { 
    isAuthenticated, 
    loading,
    error
  } = useStories();
  
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const [selectedProjectContext, setSelectedProjectContext] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [projectContextData, setProjectContextData] = useState<ProjectContextData | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType>('lld');
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
  
  // Main render logic based on authentication state
  const renderMainContent = () => {
    if (!isAuthenticated) {
      return <NotConnectedCard />;
    }
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar - Project and ticket selection */}
          <div className="md:col-span-1 space-y-6">
            <JiraProjectSelector lastRefreshTime={lastRefreshTime} />
            <StoryList />
          </div>
          
          {/* Main content area - Right side */}
          <div className="md:col-span-3">
            <StoryDetailWrapper 
              projectContext={selectedProjectContext}
              selectedDocuments={selectedDocuments}
              projectContextData={projectContextData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Generate from Jira Tickets</h1>
        </div>

        {renderMainContent()}
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

export default GeneratePage;
