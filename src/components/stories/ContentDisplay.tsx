import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Update this type to include testScripts
export type ContentType = 'lld' | 'code' | 'tests' | 'testcases' | 'testScripts';

interface ContentDisplayProps {
  content: string | null;
  contentType: ContentType;
  isLoading?: boolean;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ 
  content, 
  contentType, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (!content) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No {contentType} content generated yet. Generate content to see it here.
        </AlertDescription>
      </Alert>
    );
  }

  // Sanitize content to prevent React warnings about DOM attributes
  const sanitizeContentForReact = (content: string) => {
    return content
      // Replace Mermaid diagram code blocks with safe equivalents
      .replace(/```mermaid/g, '```')
      // Replace any other potentially problematic patterns
      .replace(/align=(["'])(?:.*?)\1/g, '')
      .replace(/width=(["'])(?:.*?)\1/g, '')
      .replace(/height=(["'])(?:.*?)\1/g, '');
  };
  
  const sanitizedContent = sanitizeContentForReact(content);

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown 
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default ContentDisplay;
