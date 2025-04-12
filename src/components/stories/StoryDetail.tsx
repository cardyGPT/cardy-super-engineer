import React, { useState, useEffect, useRef } from "react";
import { useStories } from "@/contexts/StoriesContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Code, FileText, TestTube, RefreshCw, Copy, Check, FileDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { downloadAsPDF, formatTimestampForFilename } from "@/utils/exportUtils";

const StoryDetail: React.FC = () => {
  const { selectedTicket } = useStories();
  const [activeTab, setActiveTab] = useState("lld");
  const [lldContent, setLldContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [testContent, setTestContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset state when selected ticket changes
  useEffect(() => {
    setLldContent("");
    setCodeContent("");
    setTestContent("");
    setGenerationError(null);
    setActiveTab("lld");
  }, [selectedTicket]);

  // Reset copied state after a delay
  useEffect(() => {
    const timeouts: number[] = [];
    
    Object.keys(copiedState).forEach(key => {
      if (copiedState[key]) {
        const timeout = window.setTimeout(() => {
          setCopiedState(prev => ({ ...prev, [key]: false }));
        }, 2000);
        timeouts.push(timeout);
      }
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [copiedState]);

  const handleCopyContent = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedState({ ...copiedState, [type]: true });
    
    toast({
      title: "Copied to clipboard",
      description: `${type.toUpperCase()} content has been copied to your clipboard.`,
      duration: 2000,
    });
  };

  const handleGenerateContent = async (type: 'lld' | 'code' | 'tests') => {
    if (!selectedTicket) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Check if OpenAI API is configured
      const { data: openAIData, error: openAIError } = await supabase.functions.invoke('validate-openai', {});
      
      if (openAIError || !openAIData?.valid) {
        throw new Error("OpenAI API is not configured. Please set up your API key in Settings.");
      }
      
      // Prepare the prompt based on the type
      let prompt = "";
      let systemPrompt = "";
      
      if (type === 'lld') {
        systemPrompt = "You are a senior software architect. Create a detailed low-level design document for the following user story.";
        prompt = `Create a comprehensive low-level design document for this user story: "${selectedTicket.summary}"\n\nDescription: ${selectedTicket.description || "No description provided."}\n\nInclude the following sections:\n1. Overview\n2. Component Breakdown\n3. Data Models\n4. API Endpoints\n5. Sequence Diagrams (in text format)\n6. Error Handling\n7. Security Considerations`;
      } else if (type === 'code') {
        systemPrompt = "You are a senior software developer. Generate production-ready code for the following user story.";
        prompt = `Generate production-ready code for this user story: "${selectedTicket.summary}"\n\nDescription: ${selectedTicket.description || "No description provided."}\n\nPlease include:\n1. Frontend Angular.js code\n2. Backend Node.js code\n3. PostgreSQL database scripts (including stored procedures, triggers, and functions)\n\nEnsure the code follows best practices, includes error handling, and is well-documented.`;
      } else if (type === 'tests') {
        systemPrompt = "You are a QA automation expert. Create comprehensive test cases for the following user story.";
        prompt = `Create comprehensive test cases for this user story: "${selectedTicket.summary}"\n\nDescription: ${selectedTicket.description || "No description provided."}\n\nInclude:\n1. Unit Tests\n2. Integration Tests\n3. End-to-End Tests\n4. Edge Cases\n5. Performance Test Considerations`;
      }
      
      // Call the OpenAI API through our Edge Function
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt,
          systemPrompt,
          maxTokens: 2500,
          temperature: 0.7
        }
      });
      
      if (error) throw new Error(error.message || "Failed to generate content");
      
      // Update the appropriate state based on the type
      if (type === 'lld') {
        setLldContent(data.content);
      } else if (type === 'code') {
        setCodeContent(data.content);
      } else if (type === 'tests') {
        setTestContent(data.content);
      }
      
      // Switch to the tab for the generated content
      setActiveTab(type);
      
      toast({
        title: "Content Generated",
        description: `${type.toUpperCase()} has been successfully generated.`,
        variant: "success",
      });
    } catch (error: any) {
      console.error(`Error generating ${type}:`, error);
      setGenerationError(error.message || `Failed to generate ${type}`);
      
      toast({
        title: "Generation Failed",
        description: error.message || `Failed to generate ${type}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (contentType: 'lld' | 'code' | 'tests') => {
    if (!contentRef.current || !selectedTicket) {
      toast({
        title: "Download Error",
        description: "No content available to download",
        variant: "destructive",
      });
      return;
    }

    // Show loading toast
    toast({
      title: "Preparing Download",
      description: "Creating PDF document...",
    });

    try {
      // Generate PDF and download
      const ticketKey = selectedTicket.key || 'document';
      const timestamp = formatTimestampForFilename();
      const contentLabel = contentType === 'lld' ? 'LLD' : 
                           contentType === 'code' ? 'Code' : 'Tests';
      
      const fileName = `${ticketKey}_${contentLabel}_${timestamp}`;
      
      const result = await downloadAsPDF(contentRef.current, fileName);
      
      if (result) {
        toast({
          title: "Download Complete",
          description: `${contentLabel} document has been downloaded successfully.`,
          variant: "success",
        });
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Download Failed",
        description: "There was a problem creating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!selectedTicket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Story Details</CardTitle>
          <CardDescription>Select a story to view details and generate content</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No story selected</p>
          <p className="text-sm mt-2">Select a story from the list to view details and generate content</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={contentRef}>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{selectedTicket.summary}</CardTitle>
              <CardDescription className="mt-1">{selectedTicket.key} • {selectedTicket.status}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h3 className="text-base font-medium mb-2">Description</h3>
            <div className="bg-muted p-3 rounded-md whitespace-pre-wrap text-sm">
              {selectedTicket.description || "No description provided."}
            </div>
            
            {selectedTicket.acceptance_criteria && (
              <>
                <h3 className="text-base font-medium mt-4 mb-2">Acceptance Criteria</h3>
                <div className="bg-muted p-3 rounded-md whitespace-pre-wrap text-sm">
                  {selectedTicket.acceptance_criteria}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
          <CardDescription>
            Use AI to generate LLD, code, and test cases based on the selected story
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="lld" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>LLD</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                <span>Code</span>
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex items-center gap-1">
                <TestTube className="h-4 w-4" />
                <span>Tests</span>
              </TabsTrigger>
            </TabsList>
            
            {generationError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="lld" className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Low Level Design Document</Label>
                <div className="flex gap-2">
                  {lldContent && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopyContent(lldContent, 'lld')}
                      >
                        {copiedState['lld'] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        {copiedState['lld'] ? 'Copied' : 'Copy'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadPDF('lld')}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => handleGenerateContent('lld')}
                    disabled={isGenerating}
                  >
                    {isGenerating && activeTab === 'lld' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-1" />
                        Generate LLD
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {isGenerating && activeTab === 'lld' ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <Textarea 
                  value={lldContent} 
                  onChange={(e) => setLldContent(e.target.value)}
                  placeholder="Generate a Low Level Design document based on the selected story."
                  className="min-h-[300px] font-mono text-sm"
                />
              )}
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Generated Code</Label>
                <div className="flex gap-2">
                  {codeContent && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopyContent(codeContent, 'code')}
                      >
                        {copiedState['code'] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        {copiedState['code'] ? 'Copied' : 'Copy'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadPDF('code')}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => handleGenerateContent('code')}
                    disabled={isGenerating}
                  >
                    {isGenerating && activeTab === 'code' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Code className="h-4 w-4 mr-1" />
                        Generate Code
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {isGenerating && activeTab === 'code' ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <Textarea 
                  value={codeContent} 
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="Generate code based on the selected story. Includes Angular.js frontend, Node.js backend, and PostgreSQL database scripts."
                  className="min-h-[300px] font-mono text-sm"
                />
              )}
            </TabsContent>
            
            <TabsContent value="tests" className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Test Cases</Label>
                <div className="flex gap-2">
                  {testContent && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopyContent(testContent, 'tests')}
                      >
                        {copiedState['tests'] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        {copiedState['tests'] ? 'Copied' : 'Copy'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadPDF('tests')}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => handleGenerateContent('tests')}
                    disabled={isGenerating}
                  >
                    {isGenerating && activeTab === 'tests' ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-1" />
                        Generate Tests
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {isGenerating && activeTab === 'tests' ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <Textarea 
                  value={testContent} 
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder="Generate test cases based on the selected story."
                  className="min-h-[300px] font-mono text-sm"
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryDetail;
