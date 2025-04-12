
import { Bot, User, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ChatMessageProps {
  content: string | any;  // Accept any type of content
  role: "user" | "assistant";
  isLoading?: boolean;
}

const ChatMessage = ({ content, role, isLoading = false }: ChatMessageProps) => {
  const [formattedContent, setFormattedContent] = useState<string>("");

  useEffect(() => {
    // Format the content when it changes
    setFormattedContent(getSafeContent(content));
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex justify-start">
        <div className="flex space-x-2 bg-muted p-3 rounded-lg">
          <div className="flex-shrink-0 mt-0.5">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div className="text-sm">Thinking...</div>
        </div>
      </div>
    );
  }

  // Create a robust safe content formatter that handles all possible content types
  const getSafeContent = (rawContent: any): string => {
    if (rawContent === null || rawContent === undefined) {
      return "";
    }
    
    if (typeof rawContent === 'string') {
      return rawContent;
    }
    
    // Handle Jira document format specifically
    if (rawContent && typeof rawContent === 'object' && 
        'type' in rawContent && 'version' in rawContent && 'content' in rawContent) {
      try {
        return JSON.stringify(rawContent, null, 2);
      } catch (e) {
        console.error("Error parsing Jira content object:", e);
        return "[Content formatting error]";
      }
    }
    
    // Handle any other object type
    if (typeof rawContent === 'object') {
      try {
        return JSON.stringify(rawContent, null, 2);
      } catch (e) {
        console.error("Error stringifying content object:", e);
        return "[Invalid content format]";
      }
    }
    
    // Handle any other type
    return String(rawContent || "");
  };

  return (
    <div className={`flex ${role === "assistant" ? "justify-start" : "justify-end"}`}>
      <div
        className={`flex space-x-2 max-w-[80%] ${
          role === "assistant"
            ? "bg-muted p-3 rounded-lg"
            : "bg-primary text-primary-foreground p-3 rounded-lg"
        }`}
      >
        <div className="flex-shrink-0 mt-0.5">
          {role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
        </div>
        <div className="text-sm whitespace-pre-wrap">{formattedContent}</div>
      </div>
    </div>
  );
};

export default ChatMessage;
