
import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatBubble } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Trash2, Volume2, Database, FileJson,
  Info, CheckCircle2, CornerRightDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversationDisplayProps {
  messages: Array<{ role: string, content: string }>;
  isLoading: boolean;
  selectedProjectName: string | null;
  usedDocuments: string[];
  handleClearChat: () => void;
  onReadResponse?: () => void;
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  messages,
  isLoading,
  selectedProjectName,
  usedDocuments,
  handleClearChat,
  onReadResponse
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <Card className="h-[80vh] flex flex-col">
      <CardHeader className="px-4 py-3 flex-row justify-between items-center">
        <CardTitle className="text-lg flex items-center">
          <ChatBubble className="h-5 w-5 mr-2" />
          <span>Chat</span>
          {selectedProjectName && (
            <Badge variant="outline" className="ml-2">
              {selectedProjectName}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {onReadResponse && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReadResponse}
              className="text-xs"
              title="Read last response"
            >
              <Volume2 className="h-4 w-4 mr-1" />
              Read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="text-xs"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <ReactMarkdown className="prose dark:prose-invert max-w-none">
                  {message.content}
                </ReactMarkdown>

                {/* Show document sources for assistant messages if any were used */}
                {message.role === "assistant" && index === messages.length - 1 && usedDocuments.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <Info className="h-3 w-3 mr-1" />
                      <span>Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {usedDocuments.map((doc, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs flex items-center">
                          {doc.endsWith('.json') ? (
                            <FileJson className="h-3 w-3 mr-1 text-amber-500" />
                          ) : (
                            <FileText className="h-3 w-3 mr-1 text-blue-500" />
                          )}
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 dark:bg-gray-800 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-[90%]" />
              </div>
            </div>
          )}

          {/* This empty div allows us to scroll to the end of the messages */}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;
