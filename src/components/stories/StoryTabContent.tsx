
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { JiraTicket } from '@/types/jira';
import { Send, FileCheck, AlertTriangle } from "lucide-react";
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
}

const StoryTabContent: React.FC<StoryTabContentProps> = ({
  tabId,
  title,
  content,
  contentType,
  loading,
  ticket,
  onPushToJira
}) => {
  const { toast } = useToast();
  const [pushing, setPushing] = React.useState(false);

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
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePushToJira}
              disabled={pushing}
              className="flex items-center gap-1"
            >
              {pushing ? (
                <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1"></div>
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              Push to Jira
            </Button>
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
          <p className="text-muted-foreground">
            Generate content first or select a different story
          </p>
        </div>
      )}
    </TabsContent>
  );
};

export default StoryTabContent;
