
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';
import { Button } from "@/components/ui/button";
import { downloadContent, downloadFormattedHTML } from "@/utils/contentFormatters";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload } from "lucide-react";
import { useStories } from "@/contexts/StoriesContext";

interface ContentDisplayProps {
  content: string;
  title: string;
  ticketKey?: string;
  type: "lld" | "code" | "tests" | "all";
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ 
  content, 
  title, 
  ticketKey,
  type
}) => {
  const { toast } = useToast();
  const { selectedTicket, pushToJira } = useStories();
  
  // Helper function to ensure content is properly displayed
  const formatContent = (content: string) => {
    if (!content || content.trim() === '') {
      return `No ${title.toLowerCase()} content has been generated yet. Please use the generate button to create content.`;
    }
    return content;
  };
  
  const handleDownload = () => {
    const fileName = `${ticketKey || 'ticket'}_${type}_${new Date().toISOString().split('T')[0]}.md`;
    downloadFormattedHTML(content, fileName);
    
    toast({
      title: "Content Downloaded",
      description: `${title} has been downloaded to your device`,
    });
  };
  
  const handlePushToJira = async () => {
    if (!selectedTicket) {
      toast({
        title: "Error",
        description: "No ticket selected to push content to",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const success = await pushToJira(selectedTicket.id, content);
      
      if (success) {
        toast({
          title: "Content Pushed to Jira",
          description: `${title} has been added to Jira ticket ${selectedTicket.key}`,
          variant: "default"
        });
      } else {
        throw new Error("Failed to push content to Jira");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to push content to Jira",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="prose max-w-none dark:prose-invert markdown-content" 
             style={{ minHeight: "200px", overflow: "auto", maxHeight: "600px" }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
          >
            {formatContent(content)}
          </ReactMarkdown>
        </div>
      </CardContent>
      {content && content.trim() !== '' && (
        <CardFooter className="flex justify-between pt-0">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handlePushToJira}>
            <Upload className="h-4 w-4 mr-2" />
            Push to Jira
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ContentDisplay;
