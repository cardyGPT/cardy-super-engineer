
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Send, DownloadCloud, AlertTriangle, BrainCircuit, FileText, MessageCircle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectDocument } from "@/types";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

const CardyMindPage = () => {
  const { projects, documents } = useProject();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm Cardy Mind, ready to help you with any questions about your project documents. How can I assist you today?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<ProjectDocument[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Initialize with first project if available
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);
  
  // Filter documents based on selected project
  useEffect(() => {
    if (selectedProjectId) {
      const docs = documents.filter(doc => doc.projectId === selectedProjectId);
      setFilteredDocuments(docs);
      // Reset selected documents when changing projects
      setSelectedDocuments([]);
    } else {
      setFilteredDocuments([]);
    }
  }, [selectedProjectId, documents]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: "user",
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Get selected document details
      const docsToProcess = documents.filter(doc => 
        selectedDocuments.length === 0 || selectedDocuments.includes(doc.id)
      );
      
      // If no specific documents are selected, use all documents from the project
      const projectDocs = selectedDocuments.length === 0 && selectedProjectId 
        ? documents.filter(doc => doc.projectId === selectedProjectId)
        : docsToProcess;
      
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-with-all-project-data', {
        body: {
          documents: projectDocs,
          messages: [...messages, userMessage].filter(m => m.role !== "system")
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Add assistant's response to messages
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response.content
      }]);
      
    } catch (err) {
      console.error("Error chatting with documents:", err);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
      
      // Add error message
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };
  
  const selectAllDocuments = () => {
    setSelectedDocuments(filteredDocuments.map(doc => doc.id));
  };
  
  const clearDocumentSelection = () => {
    setSelectedDocuments([]);
  };
  
  const clearConversation = () => {
    setMessages([{
      role: "assistant",
      content: "I've cleared our conversation. How can I assist you with your documents today?"
    }]);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main chat area */}
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center">
                <BrainCircuit className="mr-2 h-6 w-6 text-primary" />
                Cardy Mind
              </h1>
              <p className="text-muted-foreground">Ask questions about your project documents</p>
            </div>
            
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Conversation</CardTitle>
                <CardDescription>Selected Project: {projects.find(p => p.id === selectedProjectId)?.name || "None"}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden pb-0">
                <ScrollArea className="pr-4 h-[calc(100vh-380px)]">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex mb-4 ${message.role === "user" ? "justify-end" : ""}`}>
                      <div className={`flex gap-3 max-w-3xl ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                        <Avatar className={`h-8 w-8 ${message.role === "user" ? "bg-primary" : "bg-muted"}`}>
                          <AvatarFallback>{message.role === "user" ? "U" : "AI"}</AvatarFallback>
                          {message.role === "assistant" && (
                            <AvatarImage src="/lovable-uploads/735e3178-c57b-4678-bb2e-a75e7a381498.png" />
                          )}
                        </Avatar>
                        <div className={`px-4 py-2 rounded-lg ${
                          message.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        }`}>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex mb-4">
                      <div className="flex gap-3 max-w-3xl">
                        <Avatar className="h-8 w-8 bg-muted">
                          <AvatarFallback>AI</AvatarFallback>
                          <AvatarImage src="/lovable-uploads/735e3178-c57b-4678-bb2e-a75e7a381498.png" />
                        </Avatar>
                        <div className="px-4 py-2 rounded-lg bg-muted flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="pt-4">
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Select value={selectedProjectId || ""} onValueChange={setSelectedProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={clearConversation}
                      title="Clear conversation"
                    >
                      Clear
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Textarea 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      placeholder="Ask a question about your documents..." 
                      rows={3}
                      className="resize-none flex-1"
                      disabled={isLoading}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="self-end" 
                      disabled={!input.trim() || isLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardFooter>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="w-full md:w-72 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Document Selection</CardTitle>
                <CardDescription>
                  {selectedDocuments.length === 0 
                    ? "Using all project documents"
                    : `${selectedDocuments.length} documents selected`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {!selectedProjectId ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Please select a project first
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No documents found in this project
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between mb-2">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={selectAllDocuments}
                        className="text-xs h-8"
                      >
                        Select All
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={clearDocumentSelection}
                        className="text-xs h-8"
                      >
                        Clear
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[280px] pr-4">
                      <div className="space-y-2">
                        {filteredDocuments.map(doc => (
                          <div 
                            key={doc.id} 
                            className={`flex items-center p-2 rounded cursor-pointer ${
                              selectedDocuments.includes(doc.id) ? "bg-muted" : "hover:bg-muted/50"
                            }`}
                            onClick={() => toggleDocumentSelection(doc.id)}
                          >
                            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                            <div className="truncate flex-1 text-sm">
                              {doc.name}
                            </div>
                            <Badge variant="outline" className="ml-1 text-[10px]">
                              {doc.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Notice</AlertTitle>
              <AlertDescription className="text-xs">
                Cardy Mind can analyze document content and answer questions based on your project data.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CardyMindPage;
