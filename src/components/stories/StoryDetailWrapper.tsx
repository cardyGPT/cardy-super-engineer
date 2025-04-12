
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

const StoryDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const { tickets, selectedTicket, setSelectedTicket, loading } = useStories();
  const [activeTab, setActiveTab] = useState("lld");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for generated content
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
      }
    } catch (error) {
      console.error("Error fetching story artifacts:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStoryArtifacts();
    setIsRefreshing(false);
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoryDetailWrapper;
