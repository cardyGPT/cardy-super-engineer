
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { 
  JiraCredentials, 
  JiraTicket, 
  JiraGenerationRequest, 
  JiraGenerationResponse
} from '@/types/jira';
import { generateJiraContent, pushContentToJira } from '../api';

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
