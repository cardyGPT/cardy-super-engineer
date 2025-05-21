
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ProjectContextData, JiraGenerationRequest } from "@/types/jira";
import { Card, CardContent } from "@/components/ui/card";
import { ContentType } from "@/components/stories/ContentDisplay";

// Components
import StoryList from "@/components/stories/StoryList";
import StoryDetailWrapper from "@/components/stories/StoryDetailWrapper";
import JiraProjectSelector from "@/components/stories/JiraProjectSelector";
import ContextDialog from "@/components/stories/ContextDialog";
import NotConnectedCard from "@/components/stories/NotConnectedCard";

const GeneratePage: React.FC = () => {
  const { 
    isAuthenticated, 
    loading,
    error, 
    selectedTicket, 
    generatedContent, 
    generateContent 
  } = useStories();
  
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const [selectedProjectContext, setSelectedProjectContext] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [projectContextData, setProjectContextData] = useState<ProjectContextData | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [currentStep, setCurrentStep] = useState<string>(selectedTicket ? 'lld' : 'select');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  // Load saved context on initial page load
  useEffect(() => {
    loadSavedContext();
  }, []);

  // Set step to 'select' if no ticket is selected, otherwise maintain current step
  useEffect(() => {
    if (!selectedTicket) {
      setCurrentStep('select');
    }
  }, [selectedTicket]);
  
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
  
  const handleGenerateContent = async (type: ContentType) => {
    if (!selectedTicket) return;

    setIsGenerating(true);
    try {
      const request: JiraGenerationRequest = {
        type: type,
        jiraTicket: selectedTicket,
        projectContext: selectedProjectContext || undefined,
        selectedDocuments: selectedDocuments || [],
        additionalContext: {}
      };

      // Add previous artifacts to context for subsequent generations
      if (type !== 'lld' && generatedContent?.lldContent) {
        request.additionalContext.lldContent = generatedContent.lldContent;
      }
      
      if ((type === 'tests' || type === 'testcases' || type === 'testScripts') && generatedContent?.codeContent) {
        request.additionalContext.codeContent = generatedContent.codeContent;
      }
      
      if ((type === 'testcases' || type === 'testScripts') && generatedContent?.testContent) {
        request.additionalContext.testContent = generatedContent.testContent;
      }
      
      if (type === 'testScripts' && generatedContent?.testCasesContent) {
        request.additionalContext.testCasesContent = generatedContent.testCasesContent;
      }

      await generateContent(request);

      toast({
        title: "Content Generated",
        description: `${type.toUpperCase()} content has been generated successfully.`
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || `Failed to generate ${type.toUpperCase()} content.`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const renderStepContent = () => {
    if (currentStep === 'select') {
      return (
        <div className="space-y-4">
          <JiraProjectSelector lastRefreshTime={lastRefreshTime} />
          <StoryList />
        </div>
      );
    }
    
    return (
      <StoryDetailWrapper 
        projectContext={selectedProjectContext} 
        selectedDocuments={selectedDocuments}
        projectContextData={projectContextData}
        activeTab={currentStep as ContentType}
        setActiveTab={(tab) => setCurrentStep(tab)}
      />
    );
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto pb-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Generate From Jira Stories</h1>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {!isAuthenticated ? (
          <NotConnectedCard />
        ) : (
          <div className="space-y-6">
            {/* Current step content */}
            <Card>
              <CardContent className="pt-6">
                {renderStepContent()}
              </CardContent>
            </Card>
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

export default GeneratePage;
