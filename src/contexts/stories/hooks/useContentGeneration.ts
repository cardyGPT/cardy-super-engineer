import { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    const loadSavedContent = async () => {
      if (!selectedTicket?.key) {
        setGeneratedContent(null);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('ticket_artifacts')
          .select('*')
          .eq('story_id', selectedTicket.key)
          .maybeSingle();
          
        if (error) {
          console.error('Error loading saved content:', error);
          return;
        }
        
        if (data) {
          setGeneratedContent({
            lldContent: data.lld_content || null,
            codeContent: data.code_content || null,
            testContent: data.test_content || null,
            testCasesContent: data.testcases_content || null
          });
        } else {
          setGeneratedContent(null);
        }
      } catch (err) {
        console.error('Error loading saved content:', err);
      }
    };
    
    loadSavedContent();
  }, [selectedTicket?.key]);

  const generateContent = async (request: JiraGenerationRequest): Promise<JiraGenerationResponse | void> => {
    if (!selectedTicket) {
      setError('No ticket selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const responseData = await generateJiraContent(selectedTicket, request);
      
      setGeneratedContent(prevContent => ({
        ...prevContent,
        ...responseData
      }));
      
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
      const success = await pushContentToJira(ticketId, content);
      
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
