
import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, FileText, Clock, Trash, CopyCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

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
      return <p className="whitespace-pre-wrap">{content}</p>;
    }

    // Split the content to preserve all parts
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Reset the regex before using it in a loop
    citationRegex.lastIndex = 0;
    
    while ((match = citationRegex.exec(content)) !== null) {
      // Add the text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add the citation
      parts.push(
        <Badge key={`citation-${match.index}`} variant="outline" className="mx-1 bg-blue-50">
          {match[2]}
        </Badge>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }
    
    return <p className="whitespace-pre-wrap">{parts}</p>;
  };

  // Handle copy all to clipboard
  const handleCopyAll = () => {
    const text = messages.map(m => {
      const prefix = m.role === 'user' ? 'You: ' : 'Cardy Mind: ';
      return `${prefix}${m.content}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The entire conversation has been copied to your clipboard",
      });
    }).catch(err => {
      console.error('Could not copy text:', err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    });
  };

  // Handle copy last message
  const handleCopyLastResponse = () => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    
    if (lastAssistantMessage) {
      navigator.clipboard.writeText(lastAssistantMessage.content).then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The last response has been copied to your clipboard",
        });
      }).catch(err => {
        console.error('Could not copy text:', err);
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard",
          variant: "destructive"
        });
      });
    } else {
      toast({
        title: "Nothing to copy",
        description: "There is no assistant response to copy",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-500" /> Conversation
            </h2>
            {selectedProjectName && (
              <div className="text-sm text-muted-foreground mb-2">
                Selected Project: <Badge variant="outline">{selectedProjectName}</Badge>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleCopyAll}>
                    <CopyCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy entire conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleCopyLastResponse}>
                    <CopyCheck className="h-4 w-4 mr-1" />
                    Last
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy last response only</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleClearChat}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear the conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
                    : <p className="whitespace-pre-wrap">{message.content}</p>
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
