
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatTimestampForFilename } from "@/utils/exportUtils";
import { downloadAsPDF } from "@/utils/exportUtils";
import { AlertCircle, Copy, Download, FileCode, FileText, Send, TestTube, File } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";
import ExportToGSuite from "./ExportToGSuite";

interface ContentDisplayProps {
  title: string;
  content: string | undefined;
  contentType: "lld" | "code" | "tests";
  storyKey: string | undefined;
  storyId: string | undefined;
  onPushToJira?: (content: string) => Promise<boolean>;
  projectContext?: string | null;
  selectedDocuments?: string[];
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({
  title,
  content,
  contentType,
  storyKey,
  storyId,
  onPushToJira,
  projectContext,
  selectedDocuments
}) => {
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const { toast } = useToast();
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If we have a story key, try to fetch the timestamp for this content
    if (storyKey) {
      fetchContentTimestamp();
    }
  }, [storyKey, contentType]);

  const fetchContentTimestamp = async () => {
    try {
      const { data, error } = await supabase
        .from('story_artifacts')
        .select('updated_at')
        .eq('story_id', storyKey)
        .maybeSingle();

      if (error) {
        console.error('Error fetching timestamp:', error);
        return;
      }

      if (data && data.updated_at) {
        // Format the timestamp
        const date = new Date(data.updated_at);
        setTimestamp(date.toLocaleString());
      }
    } catch (err) {
      console.error('Error fetching timestamp:', err);
    }
  };

  const handleCopyToClipboard = () => {
    if (!content) return;

    navigator.clipboard.writeText(content).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "Content has been copied to clipboard",
          variant: "success",
        });
      },
      (err) => {
        console.error('Error copying to clipboard:', err);
        toast({
          title: "Copy failed",
          description: "Failed to copy content to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || !content) return;

    const filename = `${storyKey || 'story'}_${contentType}_${formatTimestampForFilename()}`;
    const success = await downloadAsPDF(contentRef.current, filename);

    if (success) {
      toast({
        title: "PDF Exported",
        description: "Content has been exported as PDF",
        variant: "success",
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Failed to export content as PDF",
        variant: "destructive",
      });
    }
  };

  const handleSendToJira = async () => {
    if (!content || !onPushToJira) return;

    const success = await onPushToJira(content);

    if (success) {
      toast({
        title: "Sent to Jira",
        description: "Content has been sent to Jira as a comment",
        variant: "success",
      });
    }
  };

  const getContentTypeIcon = () => {
    switch (contentType) {
      case "lld":
        return <FileText className="h-5 w-5 mr-2" />;
      case "code":
        return <FileCode className="h-5 w-5 mr-2" />;
      case "tests":
        return <TestTube className="h-5 w-5 mr-2" />;
      default:
        return <File className="h-5 w-5 mr-2" />;
    }
  };

  if (!content) {
    return (
      <Card className="w-full h-fit">
        <CardHeader>
          <CardTitle className="flex items-center">
            {getContentTypeIcon()}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No content available</AlertTitle>
            <AlertDescription>
              Generate content first or select a different story
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {getContentTypeIcon()}
            {title}
          </div>
          {timestamp && (
            <Badge variant="outline" className="ml-2">
              Generated: {timestamp}
            </Badge>
          )}
        </CardTitle>
        {storyKey && <CardDescription>For ticket: {storyKey}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div ref={contentRef} className="markdown-content overflow-auto max-h-[500px] mb-4">
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            remarkPlugins={[remarkGfm]}
            className="prose dark:prose-invert prose-code:text-xs prose-code:leading-relaxed max-w-full"
          >
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 flex-wrap justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          {onPushToJira && (
            <Button variant="outline" size="sm" onClick={handleSendToJira}>
              <Send className="h-4 w-4 mr-2" />
              Send to Jira
            </Button>
          )}
        </div>
        <ExportToGSuite
          content={content}
          contentType={contentType}
          storyKey={storyKey}
          storyId={storyId}
        />
      </CardFooter>
    </Card>
  );
};

export default ContentDisplay;
