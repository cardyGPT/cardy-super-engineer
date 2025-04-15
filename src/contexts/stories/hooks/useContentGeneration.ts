
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
import { ContentType } from '@/components/stories/ContentDisplay';

export const useContentGeneration = (
  credentials: JiraCredentials | null, 
  selectedTicket: JiraTicket | null,
  setError: (error: string | null) => void
) => {
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<JiraGenerationResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
      
      toast({
        title: "Content Generated",
        description: "Content has been generated successfully",
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

  const saveContentToDatabase = async (
    contentType: ContentType,
    content: string
  ): Promise<boolean> => {
    if (!selectedTicket || !content) {
      setError('No ticket or content to save');
      return false;
    }

    setIsSaving(true);
    
    try {
      // Call the edge function to save the content
      const { data, error } = await supabase.functions.invoke('save-story-artifacts', {
        body: {
          storyId: selectedTicket.key,
          projectId: selectedTicket.projectId || '',
          sprintId: selectedTicket.sprintId || '',
          contentType: contentType,
          content: content
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save content to database');
      }
      
      toast({
        title: "Content Saved",
        description: `${contentType.toUpperCase()} content has been saved to database`,
        variant: "success",
      });
      
      return true;
    } catch (err: any) {
      console.error('Error saving content to database:', err);
      setError(err.message || 'Failed to save content to database');
      toast({
        title: "Error",
        description: err.message || 'Failed to save content to database',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllContent = async (): Promise<boolean> => {
    if (!selectedTicket || !generatedContent) {
      setError('No ticket or content to save');
      return false;
    }

    setIsSaving(true);
    
    try {
      let success = true;
      
      // Save LLD content if available
      if (generatedContent.lldContent) {
        const lldResult = await saveContentToDatabase('lld', generatedContent.lldContent);
        if (!lldResult) success = false;
      }
      
      // Save Code content if available
      if (generatedContent.codeContent) {
        const codeResult = await saveContentToDatabase('code', generatedContent.codeContent);
        if (!codeResult) success = false;
      }
      
      // Save Test Cases content if available
      if (generatedContent.testCasesContent) {
        const testCasesResult = await saveContentToDatabase('testcases', generatedContent.testCasesContent);
        if (!testCasesResult) success = false;
      }
      
      // Save Tests content if available
      if (generatedContent.testContent) {
        const testsResult = await saveContentToDatabase('tests', generatedContent.testContent);
        if (!testsResult) success = false;
      }
      
      if (success) {
        toast({
          title: "All Content Saved",
          description: "All generated content has been saved to database",
          variant: "success",
        });
      } else {
        throw new Error('Some content failed to save');
      }
      
      return success;
    } catch (err: any) {
      console.error('Error saving all content to database:', err);
      setError(err.message || 'Failed to save all content to database');
      toast({
        title: "Error",
        description: err.message || 'Failed to save all content to database',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
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
    isSaving,
    generatedContent,
    generateContent,
    saveContentToDatabase,
    saveAllContent,
    pushToJira
  };
};
