
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { JiraTicket } from '@/types/jira';
import { Send, FileCheck, AlertTriangle, Loader2 } from "lucide-react";
import ContentDisplay from './ContentDisplay';
import { useToast } from '@/hooks/use-toast';

interface StoryTabContentProps {
  tabId: string;
  title: string;
  content: string | null;
  contentType: 'lld' | 'code' | 'tests';
  loading: boolean;
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  onPushToJira: (content: string) => Promise<boolean>;
  onGenerate: () => Promise<void>;
}

const StoryTabContent: React.FC<StoryTabContentProps> = ({
  tabId,
  title,
  content,
  contentType,
  loading,
  ticket,
  onPushToJira,
  onGenerate
}) => {
  const { toast } = useToast();
  const [pushing, setPushing] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const handlePushToJira = async () => {
    if (!content) return;
    
    setPushing(true);
    try {
      const success = await onPushToJira(content);
      
      if (success) {
        toast({
          title: "Success",
          description: `${title} has been pushed to Jira ticket ${ticket.key}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to push content to Jira",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error pushing to Jira:', err);
      toast({
        title: "Error",
        description: "Failed to push content to Jira",
        variant: "destructive",
      });
    } finally {
      setPushing(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate();
      toast({
        title: "Generated",
        description: `${title} has been generated successfully`,
      });
    } catch (err) {
      console.error('Error generating content:', err);
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <TabsContent value={tabId} className="min-h-[400px] border rounded-md p-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[300px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-muted-foreground">Generating {title}...</p>
        </div>
      ) : content ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{title}</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGenerate}
                disabled={generating || loading}
              >
                {generating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <FileCheck className="h-3 w-3 mr-1" />
                )}
                Regenerate
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePushToJira}
                disabled={pushing || !content}
              >
                {pushing ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Send className="h-3 w-3 mr-1" />
                )}
                Push to Jira
              </Button>
            </div>
          </div>
          
          <ContentDisplay 
            content={content} 
            contentType={contentType}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[300px] text-center p-6">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No content available</h3>
          <p className="text-muted-foreground mb-6">
            Generate content to see the {title.toLowerCase()} for this story
          </p>
          
          <Button onClick={handleGenerate} disabled={generating || loading}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileCheck className="h-4 w-4 mr-2" />
            )}
            Generate {title}
          </Button>
        </div>
      )}
    </TabsContent>
  );
};

export default StoryTabContent;
