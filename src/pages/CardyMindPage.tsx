
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, FileText, Check, ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/contexts/ProjectContext";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const CardyMindPage: React.FC = () => {
  const { projects, documents } = useProject();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant", content: string }>>([
    {
      role: "assistant",
      content: "Hello! I'm Cardy Mind, ready to help you with any questions about your project documents. How can I assist you today?"
    }
  ]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { toast } = useToast();
  const [usedDocuments, setUsedDocuments] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    // Add user message to the chat
    setMessages(prev => [...prev, { role: "user", content: userInput }]);
    setIsLoading(true);

    try {
      // Prepare the documents context based on the selected project and documents
      let documentsContext = "";
      let includedDocNames: string[] = [];
      
      // Filter documents based on selection criteria
      const projectDocs = selectedProject 
        ? documents.filter(doc => doc.projectId === selectedProject && doc.type !== "data-model" && doc.content)
        : documents.filter(doc => doc.type !== "data-model" && doc.content);
      
      // Further filter by selected documents if any are selected
      const filteredDocs = selectedDocuments.length > 0
        ? projectDocs.filter(doc => selectedDocuments.includes(doc.id))
        : projectDocs;
      
      if (filteredDocs.length > 0) {
        documentsContext = filteredDocs.map(doc => {
          includedDocNames.push(doc.name);
          return `Document: ${doc.name}\nContent: ${
            typeof doc.content === 'string' 
              ? doc.content.substring(0, 1500)
              : JSON.stringify(doc.content).substring(0, 1500)
          }`;
        }).join("\n\n---\n\n");
      }
      
      setUsedDocuments(includedDocNames);

      console.log("Calling API with context:", {
        messageLength: userInput.length,
        hasDocumentsContext: Boolean(documentsContext),
        documentNames: includedDocNames,
        selectedProject,
        selectedDocuments
      });

      // Instead of making a direct fetch to /api/, use the Supabase function URL
      const response = await fetch('https://gswwmieyrfdhrfwsgjnw.supabase.co/functions/v1/chat-with-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          documentsContext: documentsContext,
          projectId: selectedProject,
          documentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error communicating with AI service');
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Invalid response format from API');
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      setUserInput("");
    } catch (error: any) {
      console.error('Error in AI chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the selected project name
  const selectedProjectName = selectedProject 
    ? projects.find(p => p.id === selectedProject)?.name || "Unknown Project" 
    : null;

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    setIsDropdownOpen(false);
    // Clear selected documents when changing projects
    setSelectedDocuments([]);
  };

  const handleClearProject = () => {
    setSelectedProject(null);
    // Clear selected documents when clearing project
    setSelectedDocuments([]);
  };

  // Handle document selection
  const handleDocumentToggle = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, docId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== docId));
    }
  };

  // Select all documents
  const handleSelectAllDocuments = () => {
    const projectDocs = selectedProject 
      ? documents.filter(doc => doc.projectId === selectedProject && doc.type !== "data-model")
      : documents.filter(doc => doc.type !== "data-model");
    
    setSelectedDocuments(projectDocs.map(doc => doc.id));
  };

  // Clear all selected documents
  const handleClearAllDocuments = () => {
    setSelectedDocuments([]);
  };

  // Clear all chat messages except the initial greeting
  const handleClearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Hello! I'm Cardy Mind, ready to help you with any questions about your project documents. How can I assist you today?"
    }]);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center">
            <div className="mr-2 bg-purple-100 p-1 rounded">
              <BrainCircuit className="h-5 w-5 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold">Cardy Mind</h1>
          </div>
          <div className="text-muted-foreground">
            Ask questions about your project documents using our RAG system
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Conversation</h2>
                      {selectedProjectName && (
                        <div className="text-sm text-muted-foreground mb-4">
                          Selected Project: {selectedProjectName}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleClearChat}>
                      Clear Chat
                    </Button>
                  </div>
                  
                  <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                    {messages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`py-2 px-3 rounded-lg max-w-[80%] ${
                          message.role === 'assistant' 
                            ? 'bg-muted text-foreground' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="py-2 px-3 rounded-lg bg-muted text-foreground max-w-[80%]">
                          <div className="flex items-center">
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            <span>Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 mb-4">
                    <div className="relative flex-1">
                      <Button
                        variant="outline"
                        className="w-full flex justify-between"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <span>{selectedProjectName || "All Projects"}</span>
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg">
                          <div className="p-2">
                            {projects.map(project => (
                              <div 
                                key={project.id}
                                className="px-3 py-2 hover:bg-muted rounded cursor-pointer"
                                onClick={() => handleSelectProject(project.id)}
                              >
                                {project.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleClearProject}
                      disabled={!selectedProject}
                    >
                      Clear
                    </Button>
                  </div>
                  
                  <form onSubmit={handleSubmit}>
                    <Textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Ask a question about your documents..."
                      className="mb-2"
                      disabled={isLoading}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading || !userInput.trim()}>
                        Send
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Document Selection</h3>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        <span className="text-xs">Refresh</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        <span className="text-xs">Index Docs</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    Using all indexed project documents
                  </div>
                  
                  <div className="flex space-x-2 mb-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={handleSelectAllDocuments}
                    >
                      Select All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={handleClearAllDocuments}
                    >
                      Clear
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {documents
                      .filter(doc => !selectedProject || doc.projectId === selectedProject)
                      .filter(doc => doc.type !== "data-model")
                      .map(doc => (
                        <div key={doc.id} className="flex items-center space-x-2 p-2 border rounded text-sm">
                          <Checkbox 
                            id={`doc-${doc.id}`}
                            checked={selectedDocuments.includes(doc.id)}
                            onCheckedChange={(checked) => 
                              handleDocumentToggle(doc.id, checked as boolean)
                            }
                            className="mr-2"
                          />
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate flex-1">{doc.name}</span>
                          <div className="flex items-center bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            <span>Indexed</span>
                          </div>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium mb-1">RAG-Powered Document Assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        Cardy Mind uses AI with Retrieval Augmented Generation (RAG) to analyze your documents.
                        Documents are chunked, embedded with pgvector, and retrieved based on semantic
                        similarity for accurate answers.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

// Need to add this import at the top
import { BrainCircuit } from "lucide-react";

export default CardyMindPage;
