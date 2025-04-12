
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationDisplayProps {
  messages: Message[];
  isLoading: boolean;
  selectedProjectName: string | null;
  handleClearChat: () => void;
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  messages,
  isLoading,
  selectedProjectName,
  handleClearChat
}) => {
  return (
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
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;
