
import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ProjectDocument } from "@/types";

export type CardyMessage = {
  role: "user" | "assistant";
  content: string;
};

export function useCardyMind() {
  const { projects, documents } = useProject();
  const [messages, setMessages] = useState<CardyMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm Cardy Mind, ready to help you with any questions about your project documents. How can I assist you today?"
    }
  ]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const [usedDocuments, setUsedDocuments] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Set selected documents when project changes
  const updateSelectedDocuments = () => {
    if (selectedProject) {
      const projectDocs = documents
        .filter(doc => doc.projectId === selectedProject)
        .map(doc => doc.id);
      
      setSelectedDocuments(projectDocs);
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: "user", content: userInput }]);
    setIsLoading(true);

    try {
      let includedDocNames: string[] = [];
      
      const projectDocs = selectedProject 
        ? documents.filter(doc => doc.projectId === selectedProject)
        : documents;
      
      const filteredDocs = selectedDocuments.length > 0
        ? projectDocs.filter(doc => selectedDocuments.includes(doc.id))
        : projectDocs;
      
      filteredDocs.forEach(doc => {
        includedDocNames.push(doc.name);
      });
      
      setUsedDocuments(includedDocNames);

      console.log("Calling API with context:", {
        messageLength: userInput.length,
        documentNames: includedDocNames,
        selectedProject,
        selectedDocuments: selectedDocuments.length
      });

      const response = await supabase.functions.invoke('chat-with-all-project-data', {
        body: {
          messages: [
            ...messages,
            { role: "user", content: userInput }
          ],
          documents: filteredDocs
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error communicating with AI service');
      }

      const data = response.data;
      
      if (!data || !data.response) {
        throw new Error('Invalid response format from API');
      }
      
      if (data.context?.projects) {
        const usedDocumentNames = documents
          .filter(doc => data.context.projects.includes(doc.projectId))
          .map(doc => doc.name);
        setUsedDocuments(usedDocumentNames);
      }
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.response.content 
      }]);
      setUserInput("");
    } catch (error: any) {
      console.error('Error in AI chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI",
        variant: "destructive"
      });
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I encountered an error while processing your request. Please try again or check the selected documents." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleClearProject = () => {
    setSelectedProject(null);
    setSelectedDocuments([]);
  };

  const handleDocumentToggle = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, docId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== docId));
    }
  };

  const handleSelectAllDocuments = () => {
    const projectDocs = documents
      .filter(doc => (!selectedProject || doc.projectId === selectedProject))
      .map(doc => doc.id);
    
    setSelectedDocuments(projectDocs);
  };

  const handleClearAllDocuments = () => {
    setSelectedDocuments([]);
  };

  const handleRefreshDocuments = async () => {
    setIsRefreshing(true);
    
    try {
      if (selectedDocuments.length > 0) {
        toast({
          title: "Refreshing documents",
          description: "Updating document index...",
        });
        
        for (const docId of selectedDocuments) {
          await supabase.functions.invoke('process-document', {
            body: { documentId: docId }
          });
        }
        
        toast({
          title: "Refresh complete",
          description: `${selectedDocuments.length} documents reprocessed successfully`,
        });
      } else {
        toast({
          title: "No documents selected",
          description: "Please select documents to refresh",
        });
      }
    } catch (error: any) {
      console.error('Error refreshing documents:', error);
      toast({
        title: "Refresh failed",
        description: error.message || "Failed to refresh documents",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Hello! I'm Cardy Mind, ready to help you with any questions about your project documents. How can I assist you today?"
    }]);
    setUsedDocuments([]);
  };

  const forceProcessDocuments = async () => {
    if (!selectedDocuments.length) {
      toast({
        title: "No documents selected",
        description: "Please select documents to process first",
        variant: "destructive"
      });
      return;
    }

    setIsRefreshing(true);
    toast({
      title: "Processing documents",
      description: "Starting document processing...",
    });

    try {
      for (const docId of selectedDocuments) {
        const document = documents.find(doc => doc.id === docId);
        if (!document) continue;

        toast({
          title: "Processing",
          description: `Processing ${document.name}...`,
        });

        const result = await supabase.functions.invoke('process-document', {
          body: {
            documentId: docId,
            fileUrl: document.fileUrl,
            fileType: document.fileType || '',
            projectId: document.projectId,
            forceReprocess: true
          }
        });

        if (result.error) {
          throw new Error(`Error processing ${document.name}: ${result.error.message}`);
        }

        console.log(`Document ${document.name} processed:`, result.data);
      }

      toast({
        title: "Processing complete",
        description: `Successfully processed ${selectedDocuments.length} documents`,
      });

    } catch (error: any) {
      console.error('Document processing error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "An error occurred during document processing",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const selectedProjectName = selectedProject 
    ? projects.find(p => p.id === selectedProject)?.name || "Unknown Project" 
    : null;

  return {
    projects,
    documents,
    messages,
    selectedProject,
    selectedProjectName,
    isLoading,
    userInput,
    isRefreshing,
    usedDocuments,
    selectedDocuments,
    setUserInput,
    handleSubmit,
    handleSelectProject,
    handleClearProject,
    handleDocumentToggle,
    handleSelectAllDocuments,
    handleClearAllDocuments,
    handleRefreshDocuments,
    handleClearChat,
    forceProcessDocuments,
    updateSelectedDocuments
  };
}
