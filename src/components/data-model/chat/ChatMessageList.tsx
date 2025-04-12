
import { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ChatMessageListProps {
  messages: { role: "user" | "assistant"; content: any }[];  // Accept any content type
  isLoading: boolean;
  error: string | null;
  usedDocuments: string[];
}

const ChatMessageList = ({ messages, isLoading, error, usedDocuments }: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {usedDocuments.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-wrap gap-1 mb-2 cursor-help">
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
              <p className="text-xs">All documents being used:</p>
              <ul className="text-xs list-disc pl-4 mt-1">
                {usedDocuments.map(doc => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {messages.map((msg, index) => (
        <ChatMessage 
          key={index} 
          role={msg.role} 
          content={msg.content} 
          isLoading={false} 
        />
      ))}
      
      {isLoading && <ChatMessage role="assistant" content="" isLoading={true} />}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;
