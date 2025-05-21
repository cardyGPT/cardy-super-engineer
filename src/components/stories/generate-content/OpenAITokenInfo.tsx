
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HelpCircle } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const OpenAITokenInfo = () => {
  return (
    <Alert className="bg-blue-50">
      <div className="flex items-start">
        <HelpCircle className="h-4 w-4 mt-0.5 mr-2 text-blue-600" />
        <div className="flex-1">
          <AlertTitle className="flex items-center">
            Generation Information
            <Popover>
              <PopoverTrigger asChild>
                <button className="ml-2 inline-flex items-center justify-center rounded-full border border-blue-200 w-5 h-5 text-xs text-blue-600 hover:bg-blue-200">?</button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">About OpenAI Token Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    OpenAI models have context length limitations:
                  </p>
                  <ul className="text-sm list-disc pl-5 text-muted-foreground">
                    <li>GPT-4o: 128,000 tokens (~96,000 words)</li>
                    <li>GPT-4o-mini: 128,000 tokens (~96,000 words)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    For very large documents, content may be truncated or you may need to break up generation into smaller sections.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 text-sm space-y-1.5">
              <li><strong>Sequential Generation:</strong> Each step builds on previous content (LLD → Code → Tests → Test Cases → Test Scripts)</li>
              <li><strong>Document Export:</strong> Generated content includes proper formatting with title page, TOC, and metadata</li>
              <li><strong>Custom Refinement:</strong> Use custom prompts to refine content at each generation step</li>
              <li><strong>Persistence:</strong> Save generated artifacts to reuse them later</li>
            </ul>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default OpenAITokenInfo;
