
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { 
  JiraCredentials, 
  JiraTicket, 
  JiraGenerationRequest, 
  JiraGenerationResponse
} from '@/types/jira';
import { generateJiraContent, pushContentToJira } from '../api';
import { supabase } from '@/lib/supabase';

export const useContentGeneration = (
  credentials: JiraCredentials | null, 
  selectedTicket: JiraTicket | null,
  setError: (error: string | null) => void
) => {
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse | null>(null);
  const { toast } = useToast();

  const generateContent = async (request: JiraGenerationRequest): Promise<JiraGenerationResponse | void> => {
    if (!selectedTicket) {
      setError('No ticket selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const responseData = await generateJiraContent(selectedTicket, request);
      setGeneratedContent(responseData);
      
      // Save the generated content to the database
      if (selectedTicket.key && responseData) {
        await saveToDatabase(
          selectedTicket.key,
          selectedTicket.projectId || '',
          selectedTicket.sprintId || '',
          request.type,
          getContentByType(responseData, request.type)
        );
      }
      
      toast({
        title: "Content Generated",
        description: "Content has been generated and saved successfully",
        variant: "success",
      });
      
      return responseData;
    } catch (err: any) {
      console.error('Error generating content:', err);
      setError(err.message || 'Failed to generate content');
      toast({
        title: "Error",
        description: err.message || 'Failed to generate content',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async (
    storyId: string,
    projectId: string,
    sprintId: string,
    contentType: string,
    content: string | null
  ): Promise<void> => {
    if (!content) return;

    try {
      // Call the save-story-artifacts function
      const { error } = await supabase.functions.invoke('save-story-artifacts', {
        body: {
          storyId,
          projectId,
          sprintId,
          contentType,
          content
        }
      });

      if (error) {
        console.error('Error saving to database:', error);
        throw new Error('Failed to save content to database');
      }
      
      console.log(`Saved ${contentType} content for ticket ${storyId}`);
    } catch (err) {
      console.error('Error saving to database:', err);
      // We don't want to block the generation process if saving fails
    }
  };

  const getContentByType = (content: JiraGenerationResponse, type: string): string | null => {
    switch (type) {
      case 'lld':
        return content.lldContent || content.lld || null;
      case 'code':
        return content.codeContent || content.code || null;
      case 'tests':
        return content.testContent || content.tests || null;
      case 'testcases':
        return content.testCasesContent || null;
      default:
        return null;
    }
  };

  const pushToJira = async (ticketId: string, content: string): Promise<boolean> => {
    if (!credentials) {
      setError('No Jira credentials provided');
      return false;
    }

    try {
      const success = await pushContentToJira(credentials, ticketId, content);
      
      toast({
        title: "Success",
        description: "Content has been pushed to Jira",
        variant: "success",
      });

      return success;
    } catch (err: any) {
      console.error('Error pushing to Jira:', err);
      setError(err.message || 'Failed to push to Jira');
      toast({
        title: "Error",
        description: err.message || 'Failed to push to Jira',
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    loading,
    generatedContent,
    generateContent,
    pushToJira
  };
};
