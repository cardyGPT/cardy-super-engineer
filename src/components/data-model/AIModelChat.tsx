
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  BrainCircuit, SendHorizontal, Bot, User, 
  Loader2, AlertTriangle, Info, Filter, X
} from "lucide-react";
import { DataModel, ProjectDocument } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useProject } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface AIModelChatProps {
  dataModel: DataModel;
  documents: ProjectDocument[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AIModelChat = ({ dataModel, documents }: AIModelChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    content: "Hello! I'm your project assistant. I can help you understand your data model, explain relationships between entities, and answer questions about your project documents. How can I help you today?"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useDocuments, setUseDocuments] = useState(true);
  const [useAllProjects, setUseAllProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedDocuments, setUsedDocuments] = useState<string[]>([]);
  
  // Context filters
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
  const [selectedProjectDocs, setSelectedProjectDocs] = useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { projects, documents: allDocuments } = useProject();
  
  // Get unique project types
  const projectTypes = Array.from(new Set(projects.map(p => p.type)));

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const modelContext = {
        entities: dataModel.entities.map(entity => ({
          id: entity.id,
          name: entity.name,
          definition: entity.definition,
          type: entity.type,
          attributes: entity.attributes.map(attr => ({
            name: attr.name,
            type: attr.type,
            required: attr.required,
            isPrimaryKey: attr.isPrimaryKey,
            isForeignKey: attr.isForeignKey,
            description: attr.description
          }))
        })),
        relationships: dataModel.relationships.map(rel => ({
          id: rel.id,
          name: rel.name,
          sourceEntityId: rel.sourceEntityId,
          targetEntityId: rel.targetEntityId,
          sourceCardinality: rel.sourceCardinality,
          targetCardinality: rel.targetCardinality,
          description: rel.description
        }))
      };

      let documentsContext = "";
      let includedDocNames: string[] = [];
      
      // If using documents, filter them based on selections
      if (useDocuments) {
        let docsToInclude = useAllProjects 
          ? allDocuments.filter(doc => doc.type !== "data-model" && doc.content)
          : documents.filter(doc => doc.type !== "data-model" && doc.content);
          
        // Filter by selected project docs if any are selected
        if (selectedProjectDocs.length > 0) {
          docsToInclude = docsToInclude.filter(doc => selectedProjectDocs.includes(doc.name));
        }
        
        // Filter by selected projects if any are selected
        if (selectedProjects.length > 0) {
          docsToInclude = docsToInclude.filter(doc => {
            const project = projects.find(p => p.id === doc.projectId);
            return project && selectedProjects.includes(project.name);
          });
        }
        
        // Filter by selected project types if any are selected
        if (selectedProjectTypes.length > 0) {
          docsToInclude = docsToInclude.filter(doc => {
            const project = projects.find(p => p.id === doc.projectId);
            return project && selectedProjectTypes.includes(project.type);
          });
        }
        
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
      }
      
      setUsedDocuments(includedDocNames);

      console.log("Calling AI with context:", {
        messageLength: userMessage.length,
        modelEntityCount: modelContext.entities.length,
        hasDocumentsContext: Boolean(documentsContext),
        documentNames: includedDocNames,
        useAllProjects,
        selectedProjects,
        selectedProjectTypes,
        selectedProjectDocs
      });

      const response = await fetch('/api/chat-with-data-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          dataModel: modelContext,
          documentsContext: documentsContext,
          useAllProjects: useAllProjects,
          projectsContext: selectedProjects.length > 0 ? selectedProjects : undefined,
          projectTypesContext: selectedProjectTypes.length > 0 ? selectedProjectTypes : undefined,
          selectedDocuments: selectedProjectDocs.length > 0 ? selectedProjectDocs : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error communicating with AI service');
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Invalid response format from API');
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error('Error in AI chat:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to get response from AI";
      
      const isJsonError = errorMessage.includes('JSON') || errorMessage.includes('json');
      
      setError(isJsonError 
        ? "There was an error processing the response. The system is working to fix this issue. Please try a different question."
        : errorMessage);
      
      toast({
        title: "Error",
        description: isJsonError 
          ? "There was an error processing the AI response. Please try a different question."
          : errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterToggle = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  const clearAllFilters = () => {
    setSelectedProjects([]);
    setSelectedProjectTypes([]);
    setSelectedProjectDocs([]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted/50 p-3 border-b">
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Cardy Mind</AlertTitle>
          <AlertDescription className="text-sm">
            Ask questions about your data model AND project documents. I'll analyze both to provide 
            comprehensive answers about your project. Use the filters to focus your questions on specific contexts.
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {(selectedProjects.length > 0 || selectedProjectTypes.length > 0 || selectedProjectDocs.length > 0) && (
          <div className="bg-slate-50 p-2 rounded-md mb-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-slate-700">Active filters:</h3>
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedProjects.map(proj => (
                <Badge key={`proj-${proj}`} variant="outline" className="text-xs">
                  {proj}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setSelectedProjects(prev => prev.filter(p => p !== proj))}
                  />
                </Badge>
              ))}
              {selectedProjectTypes.map(type => (
                <Badge key={`type-${type}`} variant="secondary" className="text-xs">
                  {type}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setSelectedProjectTypes(prev => prev.filter(t => t !== type))}
                  />
                </Badge>
              ))}
              {selectedProjectDocs.map(doc => (
                <Badge key={`doc-${doc}`} variant="default" className="text-xs text-primary-foreground">
                  {doc}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => setSelectedProjectDocs(prev => prev.filter(d => d !== doc))}
                  />
                </Badge>
              ))}
            </div>
          </div>
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
        
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <BrainCircuit className="mx-auto h-12 w-12 text-muted" />
              <p className="text-muted-foreground">
                Start chatting with the AI assistant about your data model and project documents.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
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
          ))
        )}
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
          
          <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`gap-1 ${(selectedProjects.length > 0 || selectedProjectTypes.length > 0 || selectedProjectDocs.length > 0) ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={handleFilterToggle}
              >
                <Filter className="h-4 w-4" />
                {(selectedProjects.length > 0 || selectedProjectTypes.length > 0 || selectedProjectDocs.length > 0) && (
                  <Badge variant="secondary" className="h-5 w-5 text-xs p-0 flex items-center justify-center">
                    {selectedProjects.length + selectedProjectTypes.length + selectedProjectDocs.length}
                  </Badge>
                )}
                Context Menu
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Projects</h4>
                  <div className="space-y-2">
                    {projects.map(project => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`project-${project.id}`}
                          checked={selectedProjects.includes(project.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjects(prev => [...prev, project.name]);
                            } else {
                              setSelectedProjects(prev => prev.filter(p => p !== project.name));
                            }
                          }}
                        />
                        <label htmlFor={`project-${project.id}`} className="text-sm">{project.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Project Types</h4>
                  <div className="space-y-2">
                    {projectTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`type-${type}`}
                          checked={selectedProjectTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjectTypes(prev => [...prev, type]);
                            } else {
                              setSelectedProjectTypes(prev => prev.filter(t => t !== type));
                            }
                          }}
                        />
                        <label htmlFor={`type-${type}`} className="text-sm">{type}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Project Documents</h4>
                  <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                    {documents.filter(doc => doc.type !== "data-model").map(doc => (
                      <div key={doc.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`doc-${doc.id}`}
                          checked={selectedProjectDocs.includes(doc.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjectDocs(prev => [...prev, doc.name]);
                            } else {
                              setSelectedProjectDocs(prev => prev.filter(d => d !== doc.name));
                            }
                          }}
                        />
                        <label htmlFor={`doc-${doc.id}`} className="text-sm truncate">{doc.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={() => setIsFilterMenuOpen(false)}>
                    Apply Filters
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
            placeholder="Ask about your data model or project documents..."
            className="flex-1 resize-none"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIModelChat;
