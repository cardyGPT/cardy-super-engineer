
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import AIModelChat from "@/components/data-model/AIModelChat";

const CardyMindPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Cardy Mind</h1>
            <p className="text-muted-foreground">
              Ask questions about your project documents using our RAG system
            </p>
          </div>
          
          <div className="w-full max-w-4xl mx-auto">
            <AIModelChat />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CardyMindPage;
