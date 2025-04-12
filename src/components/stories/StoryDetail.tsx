
import React, { useState } from "react";
import { useStories } from "@/contexts/StoriesContext";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileDown, FileUp, Code, FileCheck, ClipboardList } from "lucide-react";
import { JiraTicket } from "@/types/jira";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const StoryDetail: React.FC = () => {
  const { selectedTicket, setSelectedTicket, generateContent, generatedContent, loading, pushToJira } = useStories();
  const { documents } = useProject();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("lld");
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  // Find any data model documents
  const dataModelDoc = documents.find(doc => doc.type === "data-model");
  const dataModel = dataModelDoc?.content;

  if (!selectedTicket) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Select a ticket to view details</p>
      </div>
    );
  }

  const handleGenerate = async (type: "lld" | "code" | "tests" | "all") => {
    if (!selectedTicket) return;
    
    // Get all document content as context
    const documentsContext = documents
      .map(doc => `${doc.name} (${doc.type}): ${JSON.stringify(doc.content).substring(0, 1000)}...`)
      .join("\n\n");
    
    await generateContent({
      type,
      jiraTicket: selectedTicket,
      dataModel,
      documentsContext
    });
  };

  const handleEdit = (tab: string, content: string) => {
    setEditedContent({
      ...editedContent,
      [tab]: content
    });
  };

  const handlePushToJira = async () => {
    if (!selectedTicket) return;
    
    const content = editedContent[activeTab] || generatedContent?.[activeTab as keyof typeof generatedContent] as string || "";
    
    if (!content) {
      toast({
        title: "No Content",
        description: "There is no content to push to Jira",
        variant: "destructive"
      });
      return;
    }
    
    const success = await pushToJira(selectedTicket.key, content);
    
    if (success) {
      toast({
        title: "Content Pushed",
        description: `Successfully updated Jira ticket ${selectedTicket.key}`,
      });
    }
  };

  const renderTicketDetails = (ticket: JiraTicket) => (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base">{ticket.key}</Badge>
            <h1 className="text-2xl font-bold">{ticket.summary}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span>Status: {ticket.status || "Unknown"}</span>
            <span>•</span>
            <span>Priority: {ticket.priority || "None"}</span>
            <span>•</span>
            <span>Assignee: {ticket.assignee || "Unassigned"}</span>
          </div>
        </div>
        <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{ticket.description}</p>
        </CardContent>
      </Card>
      
      {ticket.acceptance_criteria && (
        <Card>
          <CardHeader>
            <CardTitle>Acceptance Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{ticket.acceptance_criteria}</p>
          </CardContent>
        </Card>
      )}
      
      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={() => handleGenerate("lld")}
          disabled={loading}
        >
          <FileDown className="h-4 w-4 mr-2" />
          Generate LLD
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleGenerate("code")}
          disabled={loading}
        >
          <Code className="h-4 w-4 mr-2" />
          Generate Code
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleGenerate("tests")}
          disabled={loading}
        >
          <FileCheck className="h-4 w-4 mr-2" />
          Generate Tests
        </Button>
        <Button 
          onClick={() => handleGenerate("all")}
          disabled={loading}
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Generate All
        </Button>
      </div>
      
      {loading && (
        <Card className="mt-4">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Generating content based on your project data...</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {generatedContent && !loading && (
        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="lld">LLD Document</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="tests">Tests</TabsTrigger>
              </TabsList>
              
              <Button 
                size="sm" 
                onClick={handlePushToJira}
                disabled={loading}
              >
                <FileUp className="h-4 w-4 mr-2" />
                Push to Jira
              </Button>
            </div>
            
            <TabsContent value="lld" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Low-Level Design Document</CardTitle>
                  <CardDescription>
                    Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    className="min-h-[400px] font-mono"
                    value={editedContent.lld || generatedContent.response || ""}
                    onChange={(e) => handleEdit("lld", e.target.value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="code" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Code</CardTitle>
                  <CardDescription>
                    Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    className="min-h-[400px] font-mono"
                    value={editedContent.code || generatedContent.response || ""}
                    onChange={(e) => handleEdit("code", e.target.value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tests" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Cases</CardTitle>
                  <CardDescription>
                    Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    className="min-h-[400px] font-mono"
                    value={editedContent.tests || generatedContent.response || ""}
                    onChange={(e) => handleEdit("tests", e.target.value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );

  return renderTicketDetails(selectedTicket);
};

export default StoryDetail;
