
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStories } from "@/contexts/StoriesContext";
import StoryDetail from "./StoryDetail";
import ContentDisplay from "./ContentDisplay";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { FileText, Code, TestTube, RefreshCw } from "lucide-react";
import ExportToGSuite from "./ExportToGSuite";

const StoryDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const { stories, activeStory, setActiveStory, loading } = useStories();
  const [activeTab, setActiveTab] = useState("lld");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for generated content
  const [lldContent, setLldContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [testContent, setTestContent] = useState("");

  useEffect(() => {
    if (id && stories.length > 0 && !activeStory) {
      const story = stories.find((s) => s.id === id);
      if (story) {
        setActiveStory(story);
      }
    }
  }, [id, stories, activeStory, setActiveStory]);

  useEffect(() => {
    if (activeStory) {
      fetchStoryArtifacts();
    }
  }, [activeStory]);

  const fetchStoryArtifacts = async () => {
    if (!activeStory) return;
    
    try {
      const { data, error } = await supabase
        .from("story_artifacts")
        .select("*")
        .eq("story_id", activeStory.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setLldContent(data.lld_content || "");
        setCodeContent(data.code_content || "");
        setTestContent(data.test_content || "");
      }
    } catch (error) {
      console.error("Error fetching story artifacts:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Add refresh logic here
    setIsRefreshing(false);
  };

  if (loading || !activeStory) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-6">
      <StoryDetail story={activeStory} />
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
              <ContentDisplay content={lldContent} contentType="lld" />
            </CardContent>
          </Card>
          <ExportToGSuite storyId={activeStory.id} artifactType="lld" content={lldContent} />
        </TabsContent>
        
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <ContentDisplay content={codeContent} contentType="code" />
            </CardContent>
          </Card>
          <ExportToGSuite storyId={activeStory.id} artifactType="code" content={codeContent} />
        </TabsContent>
        
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <ContentDisplay content={testContent} contentType="test" />
            </CardContent>
          </Card>
          <ExportToGSuite storyId={activeStory.id} artifactType="test" content={testContent} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoryDetailWrapper;
