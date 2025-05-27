import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Send, X } from "lucide-react";
import { ContentType } from '@/types/jira';

interface PromptInputProps {
  contentType: ContentType;
  onSubmitPrompt: (prompt: string) => Promise<void>;
  isSubmitting: boolean;
  onClose: () => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ 
  contentType, 
  onSubmitPrompt, 
  isSubmitting,
  onClose
}) => {
  const [prompt, setPrompt] = useState('');
  
  const getDefaultPrompt = () => {
    switch (contentType) {
      case 'lld':
        return "Please improve the Low-Level Design by adding more details about component interactions and data flow.";
      case 'code':
        return "Please refine the code implementation by improving error handling and adding more comments.";
      case 'tests':
        return "Please enhance the test coverage with more edge cases and improve test organization.";
      case 'testcases':
        return "Please add more comprehensive test cases covering additional user scenarios.";
      default:
        return "";
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;
    await onSubmitPrompt(prompt);
  };
  
  const getTitle = () => {
    switch (contentType) {
      case 'lld':
        return "Customize Low-Level Design";
      case 'code':
        return "Customize Code Implementation";
      case 'tests':
        return "Customize Test Implementation";
      case 'testcases':
        return "Customize Test Cases";
      default:
        return "Customize Content";
    }
  };
  
  return (
    <Card className="mb-4 border-blue-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium flex items-center">
          <Edit className="h-4 w-4 mr-2 text-blue-500" />
          {getTitle()}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Textarea 
            placeholder={`Enter your custom instructions to improve the ${contentType}...`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px]"
            rows={5}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Example:</span> {getDefaultPrompt()}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-0">
          <Button 
            type="submit" 
            disabled={isSubmitting || !prompt.trim()} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PromptInput;
