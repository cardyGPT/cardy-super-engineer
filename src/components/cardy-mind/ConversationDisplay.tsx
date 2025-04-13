
import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Bot, CornerDownLeft, AlertCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";

interface ConversationDisplayProps {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
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

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Extract document citations from the message content
  const extractDocumentCitations = (content: string): string[] => {
    const citationRegex = /\[Document: ([^\]]+)\]/g;
    const citations = new Set<string>();
    let match;
    
    while ((match = citationRegex.exec(content)) !== null) {
      citations.add(match[1]);
    }
    
    return Array.from(citations);
  };

  // Format message with document citations highlighted
  const formatMessageWithCitations = (content: string): string => {
    return content.replace(
      /\[Document: ([^\]]+)\]/g, 
      "**[Document: $1]**"
    );
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="pb-2 flex-none">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Bot className="h-5 w-5 mr-2 text-blue-500" />
            Conversation
            {selectedProjectName && (
              <Badge variant="outline" className="ml-2">
                {selectedProjectName}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="h-8"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar className={`h-8 w-8 ${message.role === "user" ? "bg-blue-100" : "bg-purple-100"}`}>
                    {message.role === "user" ? (
                      <>
                        <AvatarFallback className="bg-blue-100 text-blue-500">U</AvatarFallback>
                        <AvatarImage src="/user-avatar.png" />
                      </>
                    ) : (
                      <>
                        <AvatarFallback className="bg-purple-100 text-purple-500">AI</AvatarFallback>
                        <AvatarImage src="/ai-avatar.png" />
                      </>
                    )}
                  </Avatar>

                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "user" ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>
                          {formatMessageWithCitations(message.content)}
                        </ReactMarkdown>
                        
                        {/* Show document citations used in this message */}
                        {message.role === "assistant" && (
                          <div className="mt-2">
                            {(() => {
                              const citations = extractDocumentCitations(message.content);
                              if (citations.length > 0) {
                                return (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="text-xs text-muted-foreground">Sources:</span>
                                    {citations.map((doc, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        <FileText className="h-3 w-3 mr-1" />
                                        {doc}
                                      </Badge>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 bg-purple-100">
                    <AvatarFallback className="bg-purple-100 text-purple-500">AI</AvatarFallback>
                    <AvatarImage src="/ai-avatar.png" />
                  </Avatar>
                  <div className="rounded-lg p-3 bg-muted flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Reference to scroll to bottom */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Footer with context information */}
      {usedDocuments.length > 0 && (
        <div className="p-2 border-t text-xs text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Using context from {usedDocuments.length} document(s)</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Documents used for context:</p>
                <ul className="list-disc pl-4 mt-1">
                  {usedDocuments.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </Card>
  );
};

export default ConversationDisplay;
