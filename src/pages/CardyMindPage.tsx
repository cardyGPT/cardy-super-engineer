
import { useState, useRef, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  BrainCircuit, SendHorizontal, Bot, User, 
  Loader2, AlertTriangle, Info, Filter, X
} from "lucide-react";
import { ProjectDocument } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CardyMindPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    content: "Hello! I'm Cardy Mind. I can help you understand your project documents. Select some documents and ask me anything about them!"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedDocuments, setUsedDocuments] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isDocFilterOpen, setIsDocFilterOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { projects, documents } = useProject();
  
  // Filter project documents (exclude data models)
  const projectDocuments = documents.filter(doc => doc.type !== "data-model");

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (selectedDocuments.length === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to chat about.",
        variant: "destructive"
      });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setError(null);
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      let documentsContext = "";
      let includedDocNames: string[] = [];
      
      // Filter selected documents
      const docsToInclude = projectDocuments.filter(doc => selectedDocuments.includes(doc.id));
      
      if (docsToInclude.length > 0) {
        documentsContext = docsToInclude.map(doc => {
          includedDocNames.push(doc.name);
          return `Document: ${doc.name}\nContent: ${
            typeof doc.content === 'string' 
              ? doc.content.substring(0, 1500)
              : JSON.stringify(doc.content).substring(0, 1500)
          }`;
        }).join("\n\n---\n\n");
      }
      
      setUsedDocuments(includedDocNames);

      console.log("Calling chat-with-documents function:", {
        messageLength: userMessage.length,
        hasDocumentsContext: Boolean(documentsContext),
        documentNames: includedDocNames,
      });

      const { data, error } = await supabase.functions.invoke('chat-with-documents', {
        body: {
          message: userMessage,
          documentsContext: documentsContext,
        },
      });

      if (error) {
        throw new Error(error.message || 'Error communicating with AI service');
      }

      if (!data || !data.response) {
        throw new Error('Invalid response format from API');
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error('Error in document chat:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to get response from AI";
      
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  const clearAllSelections = () => {
    setSelectedDocuments([]);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BrainCircuit className="h-6 w-6" />
              Cardy Mind
            </h1>
            <p className="text-gray-500">
              Chat with your project documents
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border" style={{ height: 'calc(100vh - 12rem)' }}>
          <div className="bg-muted/50 p-3 border-b">
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertTitle>Document AI Assistant</AlertTitle>
              <AlertDescription className="text-sm">
                Ask questions about your project documents. Select the documents you want to reference using the document filter below.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {selectedDocuments.length > 0 && (
                <div className="bg-slate-50 p-2 rounded-md mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-medium text-slate-700">Selected documents:</h3>
                    <Button variant="ghost" size="sm" onClick={clearAllSelections} className="h-6 px-2 text-xs">
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedDocuments.map(docId => {
                      const doc = projectDocuments.find(d => d.id === docId);
                      return (
                        <Badge key={docId} variant="outline" className="text-xs">
                          {doc?.name || docId}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => toggleDocumentSelection(docId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`flex space-x-2 max-w-[80%] ${
                      msg.role === "assistant"
                        ? "bg-muted p-3 rounded-lg"
                        : "bg-primary text-primary-foreground p-3 rounded-lg"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {msg.role === "assistant" ? (
                        <Bot className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex space-x-2 bg-muted p-3 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    <div className="text-sm">Thinking...</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="border-t p-4">
              <div className="flex items-center mb-3">
                <Popover open={isDocFilterOpen} onOpenChange={setIsDocFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`gap-1 ${selectedDocuments.length > 0 ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <Filter className="h-4 w-4" />
                      {selectedDocuments.length > 0 && (
                        <Badge variant="secondary" className="h-5 w-5 text-xs p-0 flex items-center justify-center">
                          {selectedDocuments.length}
                        </Badge>
                      )}
                      Select Documents
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Project Documents</h4>
                        {projectDocuments.length === 0 ? (
                          <p className="text-sm text-gray-500">No documents available. Upload documents in the Documents page.</p>
                        ) : (
                          <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                            {projectDocuments.map(doc => (
                              <div key={doc.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`doc-${doc.id}`}
                                  checked={selectedDocuments.includes(doc.id)}
                                  onCheckedChange={() => toggleDocumentSelection(doc.id)}
                                />
                                <label htmlFor={`doc-${doc.id}`} className="text-sm truncate">
                                  {doc.name}
                                  <span className="text-xs text-gray-500 ml-1.5">
                                    ({projects.find(p => p.id === doc.projectId)?.name || 'Unknown'})
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={clearAllSelections}>
                          Clear All
                        </Button>
                        <Button size="sm" onClick={() => setIsDocFilterOpen(false)}>
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your project documents..."
                  className="flex-1 resize-none"
                  disabled={isLoading || selectedDocuments.length === 0}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !input.trim() || selectedDocuments.length === 0}
                >
                  <SendHorizontal className="h-5 w-5" />
                </Button>
              </form>
              
              {selectedDocuments.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Please select at least one document to chat about.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CardyMindPage;
