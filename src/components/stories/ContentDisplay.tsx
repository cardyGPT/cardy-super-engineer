
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Code, TestTube } from "lucide-react";

interface ContentDisplayProps {
  content: string;
  contentType?: 'lld' | 'code' | 'tests';
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, contentType = 'lld' }) => {
  // Format JSON content (if it appears to be JSON)
  const formatContent = (text: string) => {
    if (!text) return '';
    
    try {
      // Check if the content is JSON
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const json = JSON.parse(text);
        return '```json\n' + JSON.stringify(json, null, 2) + '\n```';
      }
    } catch (e) {
      // Not valid JSON, continue with original text
    }
    
    // Return the original content
    return text;
  };

  const formattedContent = formatContent(content);
  
  const getContentIcon = () => {
    switch (contentType) {
      case 'lld':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'code':
        return <Code className="h-4 w-4 text-green-500" />;
      case 'tests':
        return <TestTube className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getContentLabel = () => {
    switch (contentType) {
      case 'lld':
        return 'Low-Level Design Document';
      case 'code':
        return 'Implementation Code';
      case 'tests':
        return 'Test Cases';
      default:
        return 'Document';
    }
  };
  
  if (!content || content.trim() === '') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <div className="mb-4 rounded-full bg-muted p-3">
          {getContentIcon()}
        </div>
        <h3 className="mb-2 text-lg font-medium">No {getContentLabel()} Generated</h3>
        <p className="max-w-sm text-sm">
          Click on one of the generate buttons to create content for this ticket.
        </p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              {getContentIcon()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getContentLabel()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="prose dark:prose-invert max-w-none overflow-auto">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          remarkPlugins={[remarkGfm]}
        >
          {formattedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ContentDisplay;
