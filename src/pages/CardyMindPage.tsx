
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, MessageSquare, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

const CardyMindPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Cardy Mind</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-1 border-2 border-dashed rounded-md flex flex-col items-center justify-center mb-4">
                <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Ask me anything about your project</p>
                <p className="text-xs text-muted-foreground max-w-md text-center">
                  I can help you understand your project's data model, documents, and provide recommendations based on best practices.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input placeholder="Type your message here..." className="flex-1" />
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CardyMindPage;
