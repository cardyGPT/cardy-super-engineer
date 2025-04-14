
import React, { useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useCardyMind } from "@/hooks/useCardyMind";

// Import components
import DocumentSelection from "@/components/cardy-mind/DocumentSelection";
import ConversationDisplay from "@/components/cardy-mind/ConversationDisplay";
import ChatInputForm from "@/components/cardy-mind/ChatInputForm";
import RagInfoCard from "@/components/cardy-mind/RagInfoCard";
import CardyMindHeader from "@/components/cardy-mind/CardyMindHeader";

const CardyMindPage: React.FC = () => {
  const {
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
  } = useCardyMind();

  useEffect(() => {
    updateSelectedDocuments();
  }, [selectedProject, documents]);

  useEffect(() => {
    console.log("Available documents:", documents.map(d => ({ id: d.id, name: d.name, project: d.projectId })));
    if (selectedProject) {
      console.log("Selected project documents:", documents
        .filter(doc => doc.projectId === selectedProject)
        .map(d => ({ id: d.id, name: d.name }))
      );
    }
  }, [documents, selectedProject]);

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <CardyMindHeader 
            isRefreshing={isRefreshing}
            onForceProcess={forceProcessDocuments}
            hasSelectedDocuments={selectedDocuments.length > 0}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ConversationDisplay 
                messages={messages}
                isLoading={isLoading}
                selectedProjectName={selectedProjectName}
                usedDocuments={usedDocuments}
                handleClearChat={handleClearChat}
              />
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              <DocumentSelection 
                documents={documents}
                selectedProject={selectedProject}
                selectedDocuments={selectedDocuments}
                isProcessing={isRefreshing}
                handleDocumentToggle={handleDocumentToggle}
                handleSelectAllDocuments={handleSelectAllDocuments}
                handleClearAllDocuments={handleClearAllDocuments}
                handleRefreshDocuments={handleRefreshDocuments}
              />
              
              <ChatInputForm
                projects={projects}
                selectedProject={selectedProject}
                selectedProjectName={selectedProjectName}
                isLoading={isLoading}
                userInput={userInput}
                setUserInput={setUserInput}
                handleSelectProject={handleSelectProject}
                handleClearProject={handleClearProject}
                handleSubmit={handleSubmit}
              />
              
              <RagInfoCard />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CardyMindPage;
