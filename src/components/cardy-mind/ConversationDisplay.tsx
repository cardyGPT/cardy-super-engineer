
import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationDisplayProps {
  messages: Message[];
  isLoading: boolean;
  selectedProjectName: string | null;
  usedDocuments: string[];
  handleClearChat: () => void;
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  messages,
  isLoading,
  selectedProjectName,
  usedDocuments,
  handleClearChat
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Highlight document citations in assistant messages
  const formatMessage = (content: string) => {
    // Check if the content contains citation patterns like [Document: X]
    const citationRegex = /\[(Document|Source): ([^\]]+)\]/g;
    if (!citationRegex.test(content)) {
      return <p>{content}</p>;
    }

    // Split by citation patterns and render with badges
    const parts = content.split(citationRegex);
    const formattedParts = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // Regular text
        if (parts[i]) {
          formattedParts.push(<span key={`text-${i}`}>{parts[i]}</span>);
        }
      } else if (i % 3 === 2) {
        // Citation text
        formattedParts.push(
          <Badge key={`citation-${i}`} variant="outline" className="mx-1 bg-blue-50">
            {parts[i]}
          </Badge>
        );
      }
    }
    
    return <p>{formattedParts}</p>;
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold mb-2">Conversation</h2>
            {selectedProjectName && (
              <div className="text-sm text-muted-foreground mb-2">
                Selected Project: {selectedProjectName}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleClearChat}>
            Clear Chat
          </Button>
        </div>
        
        {usedDocuments.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-wrap gap-1 mb-4 cursor-help">
                  <span className="text-xs text-muted-foreground mr-1 mt-1">Using documents:</span>
                  {usedDocuments.length <= 3 ? (
                    usedDocuments.map(doc => (
                      <Badge key={doc} variant="outline" className="text-xs">
                        {doc}
                      </Badge>
                    ))
                  ) : (
                    <>
                      {usedDocuments.slice(0, 2).map(doc => (
                        <Badge key={doc} variant="outline" className="text-xs">
                          {doc}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">
                        +{usedDocuments.length - 2} more
                      </Badge>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-semibold mb-1">All documents being used:</p>
                  <ul className="list-disc pl-4">
                    {usedDocuments.map(doc => (
                      <li key={doc}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div className={`py-3 px-4 rounded-lg max-w-[80%] ${
                  message.role === 'assistant' 
                    ? 'bg-muted text-foreground' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {message.role === 'assistant' 
                    ? formatMessage(message.content)
                    : <p>{message.content}</p>
                  }
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="py-3 px-4 rounded-lg bg-muted text-foreground max-w-[80%]">
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;
