
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { BrainCircuit } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";

// Import the newly created components
import DocumentSelection from "@/components/cardy-mind/DocumentSelection";
import ConversationDisplay from "@/components/cardy-mind/ConversationDisplay";
import ChatInputForm from "@/components/cardy-mind/ChatInputForm";
import RagInfoCard from "@/components/cardy-mind/RagInfoCard";

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
              <ConversationDisplay 
                messages={messages}
                isLoading={isLoading}
                selectedProjectName={selectedProjectName}
                handleClearChat={handleClearChat}
              />
            </div>
            
            <div className="lg:col-span-1">
              <DocumentSelection 
                documents={documents}
                selectedProject={selectedProject}
                selectedDocuments={selectedDocuments}
                handleDocumentToggle={handleDocumentToggle}
                handleSelectAllDocuments={handleSelectAllDocuments}
                handleClearAllDocuments={handleClearAllDocuments}
              />
              
              <RagInfoCard />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <ChatInputForm 
              projects={projects}
              selectedProject={selectedProject}
              selectedProjectName={selectedProjectName}
              isLoading={isLoading}
              isDropdownOpen={isDropdownOpen}
              userInput={userInput}
              setUserInput={setUserInput}
              setIsDropdownOpen={setIsDropdownOpen}
              handleSelectProject={handleSelectProject}
              handleClearProject={handleClearProject}
              handleSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CardyMindPage;
