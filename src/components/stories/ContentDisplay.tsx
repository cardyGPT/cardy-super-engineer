
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';

interface ContentDisplayProps {
  content: string;
  type: 'lld' | 'code' | 'tests';
  title: string;
  ticketKey: string;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, type, title, ticketKey }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    if (!content) return;
    
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    
    toast({
      title: "Content copied",
      description: "Content has been copied to clipboard"
    });
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getPlaceholderText = () => {
    switch (type) {
      case 'lld':
        return "No Low Level Design has been generated yet. Click 'Generate LLD' to create one based on this story.";
      case 'code':
        return "No code implementation has been generated yet. Click 'Generate Code' to create one based on this story.";
      case 'tests':
        return "No test cases have been generated yet. Click 'Generate Tests' to create some based on this story.";
      default:
        return "No content available";
    }
  };

  if (!content) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="mb-4">{getPlaceholderText()}</p>
        <p className="text-sm">Story: {ticketKey}</p>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0 relative">
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 bg-background/80 backdrop-blur-sm"
            onClick={handleCopy}
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
        
        <div className="p-6 max-h-[600px] overflow-auto prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-28 prose-pre:bg-slate-900 dark:prose-pre:bg-slate-800 prose-pre:text-slate-50 prose-a:text-blue-500 hover:prose-a:text-blue-600 dark:hover:prose-a:text-blue-400">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentDisplay;
