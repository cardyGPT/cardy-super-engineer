
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown } from "lucide-react";
import { Project } from "@/types";

interface ChatInputFormProps {
  projects: Project[];
  selectedProject: string | null;
  selectedProjectName: string | null;
  isLoading: boolean;
  isDropdownOpen: boolean;
  userInput: string;
  setUserInput: (input: string) => void;
  setIsDropdownOpen: (isOpen: boolean) => void;
  handleSelectProject: (projectId: string) => void;
  handleClearProject: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const ChatInputForm: React.FC<ChatInputFormProps> = ({
  projects,
  selectedProject,
  selectedProjectName,
  isLoading,
  isDropdownOpen,
  userInput,
  setUserInput,
  setIsDropdownOpen,
  handleSelectProject,
  handleClearProject,
  handleSubmit
}) => {
  return (
    <>
      <div className="flex space-x-2 mb-4">
        <div className="relative flex-1">
          <Button
            variant="outline"
            className="w-full flex justify-between"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{selectedProjectName || "All Projects"}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg">
              <div className="p-2">
                {projects.map(project => (
                  <div 
                    key={project.id}
                    className="px-3 py-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => handleSelectProject(project.id)}
                  >
                    {project.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={handleClearProject}
          disabled={!selectedProject}
        >
          Clear
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          className="mb-2"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || !userInput.trim()}>
            Send
          </Button>
        </div>
      </form>
    </>
  );
};

export default ChatInputForm;
