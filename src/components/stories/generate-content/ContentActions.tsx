
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Send, Save, Loader2 } from 'lucide-react';
import { ContentType } from '../ContentDisplay';
import { useToast } from '@/hooks/use-toast';

interface ContentActionsProps {
  content: string;
  contentType: ContentType;
  onPushToJira: (content: string) => Promise<boolean>;
  onSaveContent: (content: string) => Promise<boolean>;
}

const ContentActions: React.FC<ContentActionsProps> = ({
  content,
  contentType,
  onPushToJira,
  onSaveContent
}) => {
  const [isPushing, setIsPushing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handlePushToJira = async () => {
    if (!content) {
      toast({
        title: "Error",
        description: "No content to push to Jira",
        variant: "destructive"
      });
      return;
    }

    setIsPushing(true);
    try {
      const success = await onPushToJira(content);
      if (success) {
        toast({
          title: "Success",
          description: "Content pushed to Jira successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to push content to Jira",
        variant: "destructive"
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleSaveContent = async () => {
    if (!content) {
      toast({
        title: "Error",
        description: "No content to save",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSaveContent(content);
      if (success) {
        toast({
          title: "Success",
          description: "Content saved successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!content) {
      toast({
        title: "Error",
        description: "No content to export",
        variant: "destructive"
      });
      return;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contentType}-content.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Content exported successfully"
    });
  };

  if (!content) return null;

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="flex items-center gap-2"
      >
        <FileDown className="h-4 w-4" />
        Export
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSaveContent}
        disabled={isSaving}
        className="flex items-center gap-2"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handlePushToJira}
        disabled={isPushing}
        className="flex items-center gap-2"
      >
        {isPushing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Push to Jira
      </Button>
    </div>
  );
};

export default ContentActions;
