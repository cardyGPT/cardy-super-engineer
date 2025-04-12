import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStories } from "@/contexts/StoriesContext";
import StoryDetail from "./StoryDetail";
import ContentDisplay from "./ContentDisplay";
import ExportToGSuite from "./ExportToGSuite";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { FileText, Code, TestTube, RefreshCw, FileDown, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StoryDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const { tickets, selectedTicket, setSelectedTicket, loading, pushToJira } = useStories();
  const [activeTab, setActiveTab] = useState("lld");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const [lldContent, setLldContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [testContent, setTestContent] = useState("");

  useEffect(() => {
    if (id && tickets.length > 0 && !selectedTicket) {
      const ticket = tickets.find((t) => t.id === id);
      if (ticket) {
        setSelectedTicket(ticket);
      }
    }
  }, [id, tickets, selectedTicket, setSelectedTicket]);

  useEffect(() => {
    if (selectedTicket) {
      fetchStoryArtifacts();
    }
  }, [selectedTicket]);

  const fetchStoryArtifacts = async () => {
    if (!selectedTicket) return;
    
    try {
      setIsRefreshing(true);
      
      const { data, error } = await supabase
        .from("story_artifacts")
        .select("*")
        .eq("story_id", selectedTicket.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setLldContent(data.lld_content || "");
        setCodeContent(data.code_content || "");
        setTestContent(data.test_content || "");
        
        toast({
          title: "Content loaded",
          description: "Previously generated content has been loaded",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching story artifacts:", error);
      toast({
        title: "Error",
        description: "Failed to load story artifacts",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStoryArtifacts();
    setIsRefreshing(false);
  };
  
  const handleDownloadAndExport = (contentType: 'lld' | 'code' | 'tests' | 'all') => {
    let content = "";
    let title = "";
    
    if (contentType === 'lld') {
      content = lldContent;
      title = "Low Level Design";
    } else if (contentType === 'code') {
      content = codeContent;
      title = "Code Implementation";
    } else if (contentType === 'tests') {
      content = testContent;
      title = "Test Cases";
    } else if (contentType === 'all') {
      content = `# All Documentation\n\n## Low Level Design\n\n${lldContent}\n\n## Code Implementation\n\n${codeContent}\n\n## Test Cases\n\n${testContent}`;
      title = "Complete Documentation";
    }
    
    if (!content.trim()) {
      toast({
        title: "No content",
        description: `There is no ${title.toLowerCase()} content to export`,
        variant: "destructive",
      });
      return;
    }
    
    // Export handlers can be implemented here
  };
  
  const handlePushToJira = async (contentType: 'lld' | 'code' | 'tests' | 'all') => {
    if (!selectedTicket) {
      toast({
        title: "Error",
        description: "No ticket selected",
        variant: "destructive",
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
      content = `# Generated Documentation\n\n## Low Level Design\n\n${lldContent}\n\n## Implementation Code\n\n${codeContent}\n\n## Test Cases\n\n${testContent}`;
      contentTitle = "All Documentation";
    }
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: `No ${contentTitle.toLowerCase()} content to push to Jira`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const success = await pushToJira(selectedTicket.id, content);
      
      if (success) {
        toast({
          title: "Content Pushed to Jira",
          description: `${contentTitle} has been added to Jira ticket ${selectedTicket.key}`,
          variant: "success",
        });
      } else {
        throw new Error("Failed to push content to Jira");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to push content to Jira",
        variant: "destructive",
      });
    }
  };

  if (loading || !selectedTicket) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-6">
      <StoryDetail />
      <Separator className="my-6" />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="lld" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              LLD
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              Code
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center">
              <TestTube className="h-4 w-4 mr-2" />
              Tests
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        
        <TabsContent value="lld" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <ContentDisplay 
                content={lldContent} 
                type="lld" 
                title="Low Level Design" 
                ticketKey={selectedTicket.key}
              />
            </CardContent>
          </Card>
          
          {lldContent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export & Integration</CardTitle>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePushToJira('lld')}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Push to Jira
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadAndExport('lld')}
                      className="flex-1"
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="pt-4">
                  <ExportToGSuite 
                    storyId={selectedTicket.key} 
                    artifactType="lld" 
                    content={lldContent} 
                  />
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <ContentDisplay 
                content={codeContent} 
                type="code" 
                title="Code Implementation" 
                ticketKey={selectedTicket.key}
              />
            </CardContent>
          </Card>
          
          {codeContent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export & Integration</CardTitle>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePushToJira('code')}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Push to Jira
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadAndExport('code')}
                      className="flex-1"
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="pt-4">
                  <ExportToGSuite 
                    storyId={selectedTicket.key} 
                    artifactType="code" 
                    content={codeContent} 
                  />
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <ContentDisplay 
                content={testContent} 
                type="tests" 
                title="Test Cases" 
                ticketKey={selectedTicket.key}
              />
            </CardContent>
          </Card>
          
          {testContent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export & Integration</CardTitle>
                </CardHeader>
                <CardContent className="pb-0">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePushToJira('tests')}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Push to Jira
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadAndExport('tests')}
                      className="flex-1"
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="pt-4">
                  <ExportToGSuite 
                    storyId={selectedTicket.key} 
                    artifactType="test" 
                    content={testContent} 
                  />
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {(lldContent || codeContent || testContent) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">All Content Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePushToJira('all')}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-1" />
                Push All to Jira
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownloadAndExport('all')}
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Download All
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <ExportToGSuite 
              storyId={selectedTicket.key} 
              artifactType="all" 
              content={`# Complete Documentation for ${selectedTicket.key}\n\n## Low Level Design\n\n${lldContent}\n\n## Code Implementation\n\n${codeContent}\n\n## Test Cases\n\n${testContent}`} 
            />
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default StoryDetailWrapper;
