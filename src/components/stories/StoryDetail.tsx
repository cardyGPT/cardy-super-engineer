
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileText, Code, TestTube, RefreshCw, ArrowUpRight } from "lucide-react";
import { useStories } from "@/contexts/StoriesContext";
import { JiraTicket, ProjectContextData } from "@/types/jira";
import { Skeleton } from "@/components/ui/skeleton";
import ContentDisplay from "./ContentDisplay";
import { supabase } from "@/lib/supabase";

interface StoryDetailProps {
  ticket: JiraTicket | null;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryDetail: React.FC<StoryDetailProps> = ({ 
  ticket, 
  projectContext, 
  selectedDocuments,
  projectContextData
}) => {
  const { generateContent, pushToJira } = useStories();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lldContent, setLldContent] = useState<string | null>(null);
  const [codeContent, setCodeContent] = useState<string | null>(null);
  const [testContent, setTestContent] = useState<string | null>(null);
  const [isLldGenerated, setIsLldGenerated] = useState<boolean>(false);
  const [isCodeGenerated, setIsCodeGenerated] = useState<boolean>(false);
  const [isTestsGenerated, setIsTestsGenerated] = useState<boolean>(false);

  // Check if artifacts already exist when ticket changes
  useEffect(() => {
    if (ticket) {
      checkExistingArtifacts();
    } else {
      // Reset state when no ticket selected
      setLldContent(null);
      setCodeContent(null);
      setTestContent(null);
      setIsLldGenerated(false);
      setIsCodeGenerated(false);
      setIsTestsGenerated(false);
    }
  }, [ticket]);

  const checkExistingArtifacts = async () => {
    if (!ticket) return;

    try {
      const { data, error } = await supabase
        .from('story_artifacts')
        .select('*')
        .eq('story_id', ticket.key)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing artifacts:', error);
        return;
      }

      if (data) {
        if (data.lld_content) {
          setLldContent(data.lld_content);
          setIsLldGenerated(true);
        }
        
        if (data.code_content) {
          setCodeContent(data.code_content);
          setIsCodeGenerated(true);
        }
        
        if (data.test_content) {
          setTestContent(data.test_content);
          setIsTestsGenerated(true);
        }
      }
    } catch (err) {
      console.error('Error checking artifacts:', err);
    }
  };

  const handleGenerateLLD = async () => {
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const response = await generateContent({
        type: 'lld',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments
      });
      
      if (response && response.lld) {
        setLldContent(response.lld);
        setIsLldGenerated(true);
        setActiveTab('lld');
      }
    } catch (err: any) {
      console.error('Error generating LLD:', err);
      setError(err.message || 'Failed to generate Low Level Design');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const response = await generateContent({
        type: 'code',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments
      });
      
      if (response && response.code) {
        setCodeContent(response.code);
        setIsCodeGenerated(true);
        setActiveTab('code');
      }
    } catch (err: any) {
      console.error('Error generating code:', err);
      setError(err.message || 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTests = async () => {
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const response = await generateContent({
        type: 'tests',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments
      });
      
      if (response && response.tests) {
        setTestContent(response.tests);
        setIsTestsGenerated(true);
        setActiveTab('tests');
      }
    } catch (err: any) {
      console.error('Error generating tests:', err);
      setError(err.message || 'Failed to generate tests');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const response = await generateContent({
        type: 'all',
        jiraTicket: ticket,
        projectContext,
        selectedDocuments
      });
      
      if (response) {
        if (response.lld) {
          setLldContent(response.lld);
          setIsLldGenerated(true);
        }
        if (response.code) {
          setCodeContent(response.code);
          setIsCodeGenerated(true);
        }
        if (response.tests) {
          setTestContent(response.tests);
          setIsTestsGenerated(true);
        }
        // If response.response exists, we'll treat it as LLD content
        if (response.response) {
          setLldContent(response.response);
          setIsLldGenerated(true);
        }
        setActiveTab('lld');
      }
    } catch (err: any) {
      console.error('Error generating all content:', err);
      setError(err.message || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const openTicketInJira = () => {
    if (!ticket || !ticket.domain) return;
    
    const url = `${ticket.domain}/browse/${ticket.key}`;
    window.open(url, '_blank');
  };

  if (!ticket) {
    return (
      <Card className="w-full h-fit">
        <CardHeader>
          <CardTitle>Story Details</CardTitle>
          <CardDescription>Select a story to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No story selected</AlertTitle>
            <AlertDescription>
              Please select a story from the list to view its details
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full h-fit">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{ticket.key}: {ticket.summary}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={openTicketInJira}
                  title="Open in Jira"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="mt-1 flex flex-wrap gap-1">
                <Badge variant="outline">{ticket.issuetype?.name || 'Unknown Type'}</Badge>
                {ticket.priority && <Badge variant="outline">{ticket.priority}</Badge>}
                {ticket.status && <Badge variant="outline">{ticket.status}</Badge>}
                {ticket.story_points && <Badge variant="outline">{ticket.story_points} points</Badge>}
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {isLldGenerated && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">LLD</Badge>}
              {isCodeGenerated && <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Code</Badge>}
              {isTestsGenerated && <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Tests</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lld" disabled={!isLldGenerated && !loading}>LLD</TabsTrigger>
              <TabsTrigger value="code" disabled={!isCodeGenerated && !loading}>Code</TabsTrigger>
              <TabsTrigger value="tests" disabled={!isTestsGenerated && !loading}>Tests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {/* Description Section */}
              <div>
                <h3 className="text-md font-semibold mb-2">Description</h3>
                <div className="border rounded-md p-3 bg-muted/30 whitespace-pre-wrap text-sm">
                  {ticket.description || 'No description provided'}
                </div>
              </div>
              
              {/* Acceptance Criteria Section (if available) */}
              {ticket.acceptance_criteria && (
                <div>
                  <h3 className="text-md font-semibold mb-2">Acceptance Criteria</h3>
                  <div className="border rounded-md p-3 bg-muted/30 whitespace-pre-wrap text-sm">
                    {ticket.acceptance_criteria}
                  </div>
                </div>
              )}
              
              {/* Project Context Section */}
              {projectContextData && (
                <div>
                  <h3 className="text-md font-semibold mb-2">Project Context</h3>
                  <div className="border rounded-md p-3 bg-muted/30 text-sm">
                    <p><strong>Project:</strong> {projectContextData.project.name} ({projectContextData.project.type})</p>
                    {projectContextData.documents.length > 0 && (
                      <div className="mt-2">
                        <p><strong>Reference Documents:</strong></p>
                        <ul className="list-disc list-inside pl-2 mt-1">
                          {projectContextData.documents.map(doc => (
                            <li key={doc.id}>{doc.name} ({doc.type})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Generate Content Buttons */}
              <div>
                <h3 className="text-md font-semibold mb-2">Generate Content</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateLLD}
                    disabled={loading}
                    className="flex items-center"
                  >
                    {loading && activeTab === 'lld' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    {isLldGenerated ? 'Regenerate LLD' : 'Generate LLD'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateCode}
                    disabled={loading}
                    className="flex items-center"
                  >
                    {loading && activeTab === 'code' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Code className="h-4 w-4 mr-2" />
                    )}
                    {isCodeGenerated ? 'Regenerate Code' : 'Generate Code'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateTests}
                    disabled={loading}
                    className="flex items-center"
                  >
                    {loading && activeTab === 'tests' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    {isTestsGenerated ? 'Regenerate Tests' : 'Generate Tests'}
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleGenerateAll}
                    disabled={loading}
                    className="flex items-center"
                  >
                    {loading && activeTab === 'all' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Generate All
                  </Button>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="lld">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <ContentDisplay
                  title="Low Level Design"
                  content={lldContent || undefined}
                  contentType="lld"
                  storyKey={ticket.key}
                  storyId={ticket.id}
                  onPushToJira={pushToJira}
                  projectContext={projectContext}
                  selectedDocuments={selectedDocuments}
                />
              )}
            </TabsContent>
            
            <TabsContent value="code">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <ContentDisplay
                  title="Implementation Code"
                  content={codeContent || undefined}
                  contentType="code"
                  storyKey={ticket.key}
                  storyId={ticket.id}
                  onPushToJira={pushToJira}
                  projectContext={projectContext}
                  selectedDocuments={selectedDocuments}
                />
              )}
            </TabsContent>
            
            <TabsContent value="tests">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <ContentDisplay
                  title="Test Cases"
                  content={testContent || undefined}
                  contentType="tests"
                  storyKey={ticket.key}
                  storyId={ticket.id}
                  onPushToJira={pushToJira}
                  projectContext={projectContext}
                  selectedDocuments={selectedDocuments}
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
