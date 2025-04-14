
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { JiraTicket } from "@/types/jira";
import ContentDisplay from "./ContentDisplay";
import LoadingContent from "./LoadingContent";

interface StoryTabContentProps {
  tabId: string;
  title: string;
  content: string | null;
  contentType: "lld" | "code" | "tests";
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
  projectContext,
  selectedDocuments = [],
  onPushToJira
}) => {
  // Ensure content is string
  const safeContent = typeof content === 'string' ? content : 
                      (content && typeof content === 'object' ? JSON.stringify(content, null, 2) : 
                      String(content || ''));

  return (
    <TabsContent value={tabId}>
      {loading ? (
        <LoadingContent />
      ) : (
        <ContentDisplay
          title={title}
          content={safeContent || undefined}
          contentType={contentType}
          storyKey={ticket.key}
          storyId={ticket.id}
          onPushToJira={onPushToJira}
          projectContext={projectContext}
          selectedDocuments={selectedDocuments}
        />
      )}
    </TabsContent>
  );
};

export default StoryTabContent;
