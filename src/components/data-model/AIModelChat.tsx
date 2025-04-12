import { useState } from "react";
import { DataModel, ProjectDocument } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/contexts/ProjectContext";

// Import smaller components
import ChatMessageList from "./chat/ChatMessageList";
import ChatInput from "./chat/ChatInput";
import WelcomeMessage from "./chat/WelcomeMessage";
import ActiveFilters from "./chat/ActiveFilters";
import FilterMenu from "./chat/FilterMenu";

// Define the chat message type
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIModelChatProps {
  dataModel?: DataModel;
  documents?: ProjectDocument[];
  initialMessage?: string;
}

const AIModelChat = ({ dataModel, documents, initialMessage = "" }: AIModelChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    content: "Hello! I'm your project assistant. I can help you understand your data model, explain relationships between entities, and answer questions about your project documents. How can I help you today?"
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [useDocuments, setUseDocuments] = useState(true);
  const [useAllProjects, setUseAllProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedDocuments, setUsedDocuments] = useState<string[]>([]);
  
  // Context filters
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
  const [selectedProjectDocs, setSelectedProjectDocs] = useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  const { toast } = useToast();
  const { projects, documents: allDocuments } = useProject();

  // Use initialMessage if provided
  useState(() => {
    if (initialMessage) {
      handleSubmit(initialMessage);
    }
  });

  const handleSubmit = async (userMessage: string) => {
    if (isLoading) return;

    setError(null);
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const modelContext = {
        entities: dataModel?.entities?.map(entity => ({
          id: entity.id,
          name: entity.name,
          definition: entity.definition,
          type: entity.type,
          attributes: entity.attributes.map(attr => ({
            name: attr.name,
            type: attr.type,
            required: attr.required,
            isPrimaryKey: attr.isPrimaryKey,
            isForeignKey: attr.isForeignKey,
            description: attr.description
          }))
        })) || [],
        relationships: dataModel?.relationships?.map(rel => ({
          id: rel.id,
          name: rel.name,
          sourceEntityId: rel.sourceEntityId,
          targetEntityId: rel.targetEntityId,
          sourceCardinality: rel.sourceCardinality,
          targetCardinality: rel.targetCardinality,
          description: rel.description
        })) || []
      };

      let documentsContext = "";
      let includedDocNames: string[] = [];
      
      // If using documents, filter them based on selections
      if (useDocuments && documents) {
        let docsToInclude = useAllProjects 
          ? allDocuments.filter(doc => doc.type !== "data-model" && doc.content)
          : documents.filter(doc => doc.type !== "data-model" && doc.content);
          
        // Filter by selected project docs if any are selected
        if (selectedProjectDocs.length > 0) {
          docsToInclude = docsToInclude.filter(doc => selectedProjectDocs.includes(doc.name));
        }
        
        // Filter by selected projects if any are selected
        if (selectedProjects.length > 0) {
          docsToInclude = docsToInclude.filter(doc => {
            const project = projects.find(p => p.id === doc.projectId);
            return project && selectedProjects.includes(project.name);
          });
        }
        
        // Filter by selected project types if any are selected
        if (selectedProjectTypes.length > 0) {
          docsToInclude = docsToInclude.filter(doc => {
            const project = projects.find(p => p.id === doc.projectId);
            return project && selectedProjectTypes.includes(project.type);
          });
        }
        
        if (docsToInclude.length > 0) {
          documentsContext = docsToInclude.map(doc => {
            includedDocNames.push(doc.name);
            return `Document: ${doc.name}\nContent: ${
              typeof doc.content === 'string' 
                ? doc.content.substring(0, 1500)
                : JSON.stringify(doc.content).substring(0, 1500)
            }`;
          }).join("\n\n---\n\n");
        }
      }
      
      setUsedDocuments(includedDocNames);

      console.log("Calling AI with context:", {
        messageLength: userMessage.length,
        modelEntityCount: modelContext.entities.length,
        hasDocumentsContext: Boolean(documentsContext),
        documentNames: includedDocNames,
        useAllProjects,
        selectedProjects,
        selectedProjectTypes,
        selectedProjectDocs
      });

      const endpoint = dataModel ? '/api/chat-with-data-model' : '/api/chat-with-documents';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          dataModel: modelContext,
          documentsContext: documentsContext,
          useAllProjects: useAllProjects,
          projectsContext: selectedProjects.length > 0 ? selectedProjects : undefined,
          projectTypesContext: selectedProjectTypes.length > 0 ? selectedProjectTypes : undefined,
          selectedDocuments: selectedProjectDocs.length > 0 ? selectedProjectDocs : undefined
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
    } catch (error) {
      console.error('Error in AI chat:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to get response from AI";
      
      const isJsonError = errorMessage.includes('JSON') || errorMessage.includes('json');
      
      setError(isJsonError 
        ? "There was an error processing the response. The system is working to fix this issue. Please try a different question."
        : errorMessage);
      
      toast({
        title: "Error",
        description: isJsonError 
          ? "There was an error processing the AI response. Please try a different question."
          : errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllFilters = () => {
    setSelectedProjects([]);
    setSelectedProjectTypes([]);
    setSelectedProjectDocs([]);
  };

  const handleRemoveProject = (project: string) => {
    setSelectedProjects(prev => prev.filter(p => p !== project));
  };

  const handleRemoveProjectType = (type: string) => {
    setSelectedProjectTypes(prev => prev.filter(t => t !== type));
  };

  const handleRemoveProjectDoc = (doc: string) => {
    setSelectedProjectDocs(prev => prev.filter(d => d !== doc));
  };

  const hasActiveFilters = selectedProjects.length > 0 || 
                          selectedProjectTypes.length > 0 || 
                          selectedProjectDocs.length > 0;

  return (
    <div className="flex flex-col h-full">
      <WelcomeMessage />
      
      <div className="flex-1 overflow-y-auto space-y-2 relative">
        <ActiveFilters 
          selectedProjects={selectedProjects}
          selectedProjectTypes={selectedProjectTypes}
          selectedProjectDocs={selectedProjectDocs}
          onRemoveProject={handleRemoveProject}
          onRemoveProjectType={handleRemoveProjectType}
          onRemoveProjectDoc={handleRemoveProjectDoc}
          onClearAllFilters={clearAllFilters}
        />
        
        <ChatMessageList 
          messages={messages}
          isLoading={isLoading}
          error={error}
          usedDocuments={usedDocuments}
        />
      </div>
      
      <FilterMenu 
        isOpen={isFilterMenuOpen}
        onOpenChange={setIsFilterMenuOpen}
        selectedProjects={selectedProjects}
        setSelectedProjects={setSelectedProjects}
        selectedProjectTypes={selectedProjectTypes}
        setSelectedProjectTypes={setSelectedProjectTypes}
        selectedProjectDocs={selectedProjectDocs}
        setSelectedProjectDocs={setSelectedProjectDocs}
        clearAllFilters={clearAllFilters}
        documents={documents || []}
        triggerElement={<div />} // This will be provided by ChatInput
      />
      
      <ChatInput 
        onSendMessage={handleSubmit}
        isLoading={isLoading}
        useDocuments={useDocuments}
        setUseDocuments={setUseDocuments}
        useAllProjects={useAllProjects}
        setUseAllProjects={setUseAllProjects}
        onOpenFilterMenu={() => setIsFilterMenuOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
};

export default AIModelChat;
