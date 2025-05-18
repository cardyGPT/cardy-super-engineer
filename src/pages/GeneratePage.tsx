
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RefreshCw, Settings, Database, ChevronRight, StepForward, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ProjectContextData, JiraGenerationRequest, JiraTicket } from "@/types/jira";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Steps, Step } from "@/components/ui/steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Components
import StoryList from "@/components/stories/StoryList";
import StoryDetailWrapper from "@/components/stories/StoryDetailWrapper";
import JiraProjectSelector from "@/components/stories/JiraProjectSelector";
import ContextBanner from "@/components/stories/ContextBanner";
import ContextDialog from "@/components/stories/ContextDialog";
import NotConnectedCard from "@/components/stories/NotConnectedCard";

// Generation steps
const STEPS = [
  { id: 'select', title: 'Select Story' },
  { id: 'lld', title: 'Low-Level Design' },
  { id: 'code', title: 'Implementation Code' },
  { id: 'testcases', title: 'Test Cases' },
  { id: 'tests', title: 'Unit Tests' }
];

const GeneratePage: React.FC = () => {
  const { isAuthenticated, loading, refreshAll, error, selectedTicket, generatedContent, generateContent } = useStories();
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Set step to 'select' if no ticket is selected, otherwise set to 'lld'
  useEffect(() => {
    if (!selectedTicket) {
      setCurrentStep('select');
    } else if (currentStep === 'select') {
      setCurrentStep('lld');
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

  const handleGenerateContent = async (type: 'lld' | 'code' | 'tests' | 'testcases') => {
    if (!selectedTicket) return;

    setIsGenerating(true);
    try {
      const request: JiraGenerationRequest = {
        type,
        jiraTicket: selectedTicket,
        projectContext: selectedProjectContext || undefined,
        selectedDocuments: selectedDocuments || [],
        additionalContext: {}
      };

      // Add previous artifacts to context for subsequent generations
      if (type !== 'lld' && generatedContent?.lldContent) {
        request.additionalContext.lldContent = generatedContent.lldContent;
      }
      
      if ((type === 'tests' || type === 'testcases') && generatedContent?.codeContent) {
        request.additionalContext.codeContent = generatedContent.codeContent;
      }
      
      if (type === 'tests' && generatedContent?.testCasesContent) {
        request.additionalContext.testCasesContent = generatedContent.testCasesContent;
      }

      await generateContent(request);
      
      // Move to next step after successful generation
      const currentIndex = STEPS.findIndex(step => step.id === currentStep);
      if (currentIndex < STEPS.length - 1) {
        setCurrentStep(STEPS[currentIndex + 1].id);
      }

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

  const handleNextStep = () => {
    const currentIndex = STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
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
        activeTab={currentStep}
        setActiveTab={setCurrentStep}
      />
    );
  };

  const canProceed = () => {
    if (currentStep === 'select') {
      return !!selectedTicket;
    }

    // Check if the current step has been generated
    if (currentStep === 'lld') {
      return !!generatedContent?.lldContent;
    } else if (currentStep === 'code') {
      return !!generatedContent?.codeContent;
    } else if (currentStep === 'testcases') {
      return !!generatedContent?.testCasesContent;
    } else if (currentStep === 'tests') {
      return !!generatedContent?.testContent;
    }

    return true;
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Generate From Jira Stories</h1>
          
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
                {(loading || isRefreshing) ? 'Loading...' : 'Refresh All'}
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
          <div className="space-y-6">
            {/* Step progress indicator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Generation Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
                  {STEPS.map((step, idx) => (
                    <React.Fragment key={step.id}>
                      <Button 
                        variant={currentStep === step.id ? "default" : "outline"}
                        size="sm"
                        disabled={!selectedTicket && step.id !== 'select'}
                        onClick={() => setCurrentStep(step.id)}
                        className={`flex-1 ${currentStep === step.id ? 'bg-blue-600' : ''}`}
                      >
                        <span className="mr-2">{idx + 1}</span>
                        {step.title}
                      </Button>
                      
                      {idx < STEPS.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 'select'}
                  >
                    Previous
                  </Button>
                  
                  {currentStep !== 'select' && (
                    <Button
                      variant="default"
                      onClick={() => handleGenerateContent(currentStep as any)}
                      disabled={isGenerating}
                      className="ml-auto mr-2"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          Generate {currentStep.toUpperCase()}
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="default"
                    onClick={handleNextStep}
                    disabled={!canProceed() || currentStep === STEPS[STEPS.length - 1].id}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Current step content */}
            <div>
              {renderStepContent()}
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

export default GeneratePage;
