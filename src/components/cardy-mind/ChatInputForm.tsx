
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Send, Sparkles, Braces, FileText } from "lucide-react";
import { Project } from "@/types";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ChatInputFormProps {
  projects: Project[];
  selectedProject: string | null;
  selectedProjectName: string | null;
  isLoading: boolean;
  userInput: string;
  setUserInput: (input: string) => void;
  handleSelectProject: (projectId: string) => void;
  handleClearProject: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const ChatInputForm: React.FC<ChatInputFormProps> = ({
  projects,
  selectedProject,
  selectedProjectName,
  isLoading,
  userInput,
  setUserInput,
  handleSelectProject,
  handleClearProject,
  handleSubmit
}) => {
  const [rows, setRows] = useState(2);

  // Handle text area auto-expand
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
    const lineCount = e.target.value.split('\n').length;
    setRows(Math.min(5, Math.max(2, lineCount)));
  };

  // Example questions for different document types
  const exampleQuestions = {
    dataModel: [
      "Explain the entity relationships in our data model",
      "What are the key entities in our data model?",
      "How is the user entity related to other entities?",
      "What attributes does the provider_management data model have?"
    ],
    requirements: [
      "Summarize the system requirements for this project",
      "What are the key functional requirements in the document?",
      "Extract the non-functional requirements from the document",
      "What are the user authentication requirements?"
    ],
    technical: [
      "Explain the authorization flow in the technical design",
      "How is data being secured according to the design?",
      "What technology stack is specified in the document?",
      "Describe the API architecture from the technical design"
    ],
    coding: [
      "What coding guidelines should I follow for this project?",
      "What are the naming conventions for variables?",
      "Explain the error handling patterns in the guidelines",
      "What testing practices are recommended?"
    ]
  };

  // Determine which category to show based on selected project
  const getExampleQuestionCategory = () => {
    if (!selectedProject) return 'dataModel';
    
    const projectType = projects.find(p => p.id === selectedProject)?.type;
    if (projectType?.includes('model')) return 'dataModel';
    if (projectType?.includes('requirement')) return 'requirements';
    if (projectType?.includes('design')) return 'technical';
    if (projectType?.includes('coding')) return 'coding';
    
    return 'dataModel'; // default
  };

  const questionCategory = getExampleQuestionCategory();
  const currentExamples = exampleQuestions[questionCategory as keyof typeof exampleQuestions];
  
  const insertExampleQuestion = (question: string) => {
    setUserInput(question);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex justify-between items-center"
            >
              <span className="truncate">{selectedProjectName || "All Projects"}</span>
              <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px] max-h-[300px] overflow-y-auto">
            {projects.map(project => (
              <DropdownMenuItem 
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className="cursor-pointer"
              >
                {project.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="outline" 
          onClick={handleClearProject}
          disabled={!selectedProject}
        >
          Clear
        </Button>
      </div>
      
      <div>
        <div className="bg-muted/40 rounded-lg p-3 mb-2">
          <h4 className="text-xs font-medium mb-2 flex items-center">
            <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
            {questionCategory === 'dataModel' && <Braces className="h-3 w-3 mr-1 text-blue-500" />}
            {questionCategory === 'requirements' && <FileText className="h-3 w-3 mr-1 text-green-500" />}
            Example Questions
          </h4>
          <div className="flex flex-wrap gap-2">
            {currentExamples.map((question, index) => (
              <Button 
                key={index} 
                variant="outline" 
                size="sm" 
                className="text-xs bg-background"
                onClick={() => insertExampleQuestion(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          value={userInput}
          onChange={handleTextAreaChange}
          placeholder="Ask a question about your documents..."
          className="pr-12 resize-none"
          disabled={isLoading}
          rows={rows}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="absolute bottom-2 right-2"
          disabled={isLoading || !userInput.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInputForm;
