
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  useDocuments: boolean;
  setUseDocuments: (value: boolean) => void;
  useAllProjects: boolean;
  setUseAllProjects: (value: boolean) => void;
  onOpenFilterMenu: () => void;
  hasActiveFilters: boolean;
}

const ChatInput = ({
  onSendMessage,
  isLoading,
  useDocuments,
  setUseDocuments,
  useAllProjects,
  setUseAllProjects,
  onOpenFilterMenu,
  hasActiveFilters
}: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="border-t p-4">
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center">
          <Switch 
            id="use-documents" 
            checked={useDocuments}
            onCheckedChange={setUseDocuments}
          />
          <label htmlFor="use-documents" className="ml-2 text-sm text-muted-foreground">
            Include project documents
          </label>
        </div>
        
        <div className="flex items-center">
          <Switch 
            id="use-all-projects" 
            checked={useAllProjects}
            onCheckedChange={setUseAllProjects}
            disabled={!useDocuments}
          />
          <label 
            htmlFor="use-all-projects" 
            className={`ml-2 text-sm ${!useDocuments ? 'text-gray-400' : 'text-muted-foreground'}`}
          >
            Include all projects' documents
          </label>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-1 ${hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''}`}
          onClick={onOpenFilterMenu}
        >
          <ContextFilterButton hasActiveFilters={hasActiveFilters} />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your data model or project documents..."
          className="flex-1 resize-none"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};

const ContextFilterButton = ({ hasActiveFilters }: { hasActiveFilters: boolean }) => {
  return (
    <>
      <Filter className="h-4 w-4" />
      {hasActiveFilters && (
        <Badge variant="secondary" className="h-5 w-5 text-xs p-0 flex items-center justify-center">
          {/* This would display the count of active filters */}
          •
        </Badge>
      )}
      Context Menu
    </>
  );
};

// Need to add this import at the top
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default ChatInput;
