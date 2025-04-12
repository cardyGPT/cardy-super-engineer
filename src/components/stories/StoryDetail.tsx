import React, { useState, useEffect, useRef } from "react";
import { useStories } from "@/contexts/StoriesContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Code, FileText, TestTube, RefreshCw, Copy, Check, FileDown, Upload, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { downloadAsPDF, formatTimestampForFilename } from "@/utils/exportUtils";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';

const StoryDetail: React.FC = () => {
  const { selectedTicket, pushToJira } = useStories();
  const [activeTab, setActiveTab] = useState("lld");
  const [lldContent, setLldContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [testContent, setTestContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const safeStringify = (content: any): string => {
    if (content === null || content === undefined) return "";
    
    if (typeof content === 'string') return content;
    
    if (typeof content === 'object') {
      try {
        return JSON.stringify(content);
      } catch (e) {
        console.error("Error stringifying content object:", e);
        return "[Content formatting error]";
      }
    }
    
    return String(content);
  };

  useEffect(() => {
    setLldContent("");
    setCodeContent("");
    setTestContent("");
    setGenerationError(null);
    setActiveTab("lld");
    
    const loadArtifacts = async () => {
      if (!selectedTicket) return;
      
      setIsLoading(true);
      
      try {
        console.log(`Loading artifacts for story ${selectedTicket.key}`);
        const { data, error } = await supabase
          .from('story_artifacts')
          .select('*')
          .eq('story_id', safeStringify(selectedTicket.key))
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') {
            console.error("Error loading artifacts:", error);
          } else {
            console.log(`No existing artifacts found for story ${selectedTicket.key}`);
          }
        } else if (data) {
          console.log(`Found existing artifacts for story ${selectedTicket.key}`);
          setLldContent(data.lld_content || "");
          setCodeContent(data.code_content || "");
          setTestContent(data.test_content || "");
          
          toast({
            title: "Loaded saved content",
            description: "Previously generated content has been loaded."
          });
        }
      } catch (err) {
        console.error("Error loading artifacts:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadArtifacts();
  }, [selectedTicket, toast]);

  useEffect(() => {
    const saveArtifacts = async () => {
      if (!selectedTicket || isSaving) return;
      if (!lldContent && !codeContent && !testContent) return;
      
      setIsSaving(true);
      
      try {
        const storyId = safeStringify(selectedTicket.key);
        const projectId = selectedTicket.projectId ? safeStringify(selectedTicket.projectId) : null;
        const sprintId = selectedTicket.sprintId ? safeStringify(selectedTicket.sprintId) : null;
        
        console.log(`Saving artifacts for story ${storyId}`);
        
        const { data, error } = await supabase
          .from('story_artifacts')
          .upsert({
            story_id: storyId,
            project_id: projectId,
            sprint_id: sprintId,
            lld_content: lldContent,
            code_content: codeContent,
            test_content: testContent,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'story_id'
          });
        
        if (error) {
          console.error("Error saving artifacts:", error);
          toast({
            title: "Error",
            description: "Failed to save generated content",
            variant: "destructive"
          });
        } else {
          console.log(`Successfully saved artifacts for story ${storyId}`);
        }
      } catch (err) {
        console.error("Error saving artifacts:", err);
      } finally {
        setIsSaving(false);
      }
    };
    
    const timer = setTimeout(() => {
      if (selectedTicket && (lldContent || codeContent || testContent)) {
        saveArtifacts();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [selectedTicket, lldContent, codeContent, testContent, isSaving, toast]);

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
      description: `${type.toUpperCase()} content has been copied to your clipboard.`
    });
  };

  const handleGenerateContent = async (type: 'lld' | 'code' | 'tests') => {
    if (!selectedTicket) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const { data: openAIData, error: openAIError } = await supabase.functions.invoke('validate-openai', {});
      
      if (openAIError || !openAIData?.valid) {
        throw new Error("OpenAI API is not configured. Please set up your API key in Settings.");
      }
      
      let prompt = "";
      let systemPrompt = "";
      
      if (type === 'lld') {
        systemPrompt = "You are a senior software architect. Create a detailed low-level design document for the following user story.";
        prompt = `Create a comprehensive low-level design document for this user story: "${safeStringify(selectedTicket.summary)}"\n\nDescription: ${safeStringify(selectedTicket.description || "No description provided.")}\n\nInclude the following sections:\n1. Overview\n2. Component Breakdown\n3. Data Models\n4. API Endpoints\n5. Sequence Diagrams (in text format)\n6. Error Handling\n7. Security Considerations`;
      } else if (type === 'code') {
        systemPrompt = "You are a senior software developer. Generate production-ready code for the following user story.";
        prompt = `Generate production-ready code for this user story: "${safeStringify(selectedTicket.summary)}"\n\nDescription: ${safeStringify(selectedTicket.description || "No description provided.")}\n\nPlease include:\n1. Frontend Angular.js code\n2. Backend Node.js code\n3. PostgreSQL database scripts (including stored procedures, triggers, and functions)\n\nEnsure the code follows best practices, includes error handling, and is well-documented.`;
      } else if (type === 'tests') {
        systemPrompt = "You are a QA automation expert. Create comprehensive test cases for the following user story.";
        prompt = `Create comprehensive test cases for this user story: "${safeStringify(selectedTicket.summary)}"\n\nDescription: ${safeStringify(selectedTicket.description || "No description provided.")}\n\nInclude:\n1. Unit Tests\n2. Integration Tests\n3. End-to-End Tests\n4. Edge Cases\n5. Performance Test Considerations`;
      }
      
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt,
          systemPrompt,
          maxTokens: 2500,
          temperature: 0.7
        }
      });
      
      if (error) throw new Error(error.message || "Failed to generate content");
      
      const responseContent = safeStringify(data.content);
      
      if (type === 'lld') {
        setLldContent(responseContent);
      } else if (type === 'code') {
        setCodeContent(responseContent);
      } else if (type === 'tests') {
        setTestContent(responseContent);
      }
      
      setActiveTab(type);
      
      toast({
        title: "Content Generated",
        description: `${type.toUpperCase()} has been successfully generated and saved.`
      });
    } catch (error: any) {
      console.error(`Error generating ${type}:`, error);
      setGenerationError(error.message || `Failed to generate ${type}`);
      
      toast({
        title: "Generation Failed",
        description: error.message || `Failed to generate ${type}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!selectedTicket) return;
    
    setIsGeneratingAll(true);
    setGenerationError(null);
    
    try {
      await handleGenerateContent('lld');
      await handleGenerateContent('code');
      await handleGenerateContent('tests');
      
      toast({
        title: "All Content Generated",
        description: "LLD, Code, and Test Cases have been successfully generated and saved."
      });
    } catch (error: any) {
      console.error("Error generating all content:", error);
      setGenerationError(error.message || "Failed to generate all content");
      
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate all content",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleDownloadPDF = async (contentType: 'lld' | 'code' | 'tests' | 'all') => {
    if (!contentRef.current || !selectedTicket) {
      toast({
        title: "Download Error",
        description: "No content available to download",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Preparing Download",
      description: "Creating PDF document..."
    });

    try {
      const ticketKey = safeStringify(selectedTicket.key) || 'document';
      const timestamp = formatTimestampForFilename();
      const contentLabel = contentType === 'lld' ? 'LLD' : 
                          contentType === 'code' ? 'Code' : 
                          contentType === 'tests' ? 'Tests' : 'All';
      
      const fileName = `${ticketKey}_${contentLabel}_${timestamp}`;
      
      const result = await downloadAsPDF(contentRef.current, fileName);
      
      if (result) {
        toast({
          title: "Download Complete",
          description: `${contentLabel} document has been downloaded successfully.`
        });
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Download Failed",
        description: "There was a problem creating your PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePushToJira = async (contentType: 'lld' | 'code' | 'tests' | 'all') => {
    if (!selectedTicket) {
      toast({
        title: "Error",
        description: "No ticket selected to push content to",
        variant: "destructive"
      });
      return;
    }
    
    let content = "";
    let contentTitle = "";
    
    if (contentType === 'lld') {
      content = lldContent;
      contentTitle = "Low Level Design";
    } else if (contentType === 'code') {
      content = codeContent;
      contentTitle = "Implementation Code";
    } else if (contentType === 'tests') {
      content = testContent;
      contentTitle = "Test Cases";
    } else if (contentType === 'all') {
      content = `# Generated Documentation for ${safeStringify(selectedTicket.key)}\n\n## Low Level Design\n\n${lldContent}\n\n## Implementation Code\n\n${codeContent}\n\n## Test Cases\n\n${testContent}`;
      contentTitle = "All Documentation";
    }
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: `No ${contentTitle} content to push to Jira`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      const success = await pushToJira(selectedTicket.id, content);
      
      if (success) {
        toast({
          title: "Content Pushed to Jira",
          description: `${contentTitle} has been added to Jira ticket ${selectedTicket.key}`,
          variant: "success"
        });
      } else {
        throw new Error("Failed to push content to Jira");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to push content to Jira",
        variant: "destructive"
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
              <CardTitle className="text-xl">{safeStringify(selectedTicket.summary)}</CardTitle>
              <CardDescription className="mt-1">{safeStringify(selectedTicket.key)} • {safeStringify(selectedTicket.status)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h3 className="text-base font-medium mb-2">Description</h3>
            <div className="bg-muted p-3 rounded-md whitespace-pre-wrap text-sm">
              {safeStringify(selectedTicket.description) || "No description provided."}
            </div>
            
            {selectedTicket.acceptance_criteria && (
              <>
                <h3 className="text-base font-medium mt-4 mb-2">Acceptance Criteria</h3>
                <div className="bg-muted p-3 rounded-md whitespace-pre-wrap text-sm">
                  {safeStringify(selectedTicket.acceptance_criteria)}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Generate Content</CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleGenerateAll}
                disabled={isGenerating || isGeneratingAll}
              >
                {isGeneratingAll ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Generating All...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Generate All
                  </>
                )}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDownloadPDF('all')}
              >
                <Download className="h-4 w-4 mr-1" />
                Download All
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handlePushToJira('all')}
              >
                <Upload className="h-4 w-4 mr-1" />
                Push All to Jira
              </Button>
            </div>
          </div>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePushToJira('lld')}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Push to Jira
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => handleGenerateContent('lld')}
                    disabled={isGenerating || isGeneratingAll}
                  >
                    {(isGenerating && activeTab === 'lld') || isGeneratingAll ? (
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
              
              {(isGenerating && activeTab === 'lld') || isGeneratingAll ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="border rounded-md p-4 min-h-[300px] overflow-auto">
                  <div className="prose max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeHighlight]}
                    >
                      {lldContent || "Generate a Low Level Design document based on the selected story."}
                    </ReactMarkdown>
                  </div>
                </div>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePushToJira('code')}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Push to Jira
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => handleGenerateContent('code')}
                    disabled={isGenerating || isGeneratingAll}
                  >
                    {(isGenerating && activeTab === 'code') || isGeneratingAll ? (
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
              
              {(isGenerating && activeTab === 'code') || isGeneratingAll ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="border rounded-md p-4 min-h-[300px] overflow-auto">
                  <div className="prose max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeHighlight]}
                    >
                      {codeContent || "Generate code based on the selected story. Includes Angular.js frontend, Node.js backend, and PostgreSQL database scripts."}
                    </ReactMarkdown>
                  </div>
                </div>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePushToJira('tests')}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Push to Jira
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => handleGenerateContent('tests')}
                    disabled={isGenerating || isGeneratingAll}
                  >
                    {(isGenerating && activeTab === 'tests') || isGeneratingAll ? (
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
              
              {(isGenerating && activeTab === 'tests') || isGeneratingAll ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="border rounded-md p-4 min-h-[300px] overflow-auto">
                  <div className="prose max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeHighlight]}
                    >
                      {testContent || "Generate test cases based on the selected story."}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryDetail;
