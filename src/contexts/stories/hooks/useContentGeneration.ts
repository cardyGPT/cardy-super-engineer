
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
      // Prepare the data for saving
      const columnMapping: Record<ContentType, string> = {
        lld: 'lld_content',
        code: 'code_content',
        tests: 'test_content',
        testcases: 'testcases_content',
        testScripts: 'testscripts_content'
      };
      
      const column = columnMapping[contentType];
      
      // Check if there's already an entry for this ticket
      const { data: existingArtifact, error: fetchError } = await supabase
        .from('ticket_artifacts')
        .select('*')
        .eq('story_id', selectedTicket.key)
        .maybeSingle();
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      let result;
      
      if (existingArtifact) {
        // Update existing record
        const { data, error } = await supabase
          .from('ticket_artifacts')
          .update({ 
            [column]: content,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingArtifact.id)
          .select();
          
        if (error) throw new Error(error.message);
        result = data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('ticket_artifacts')
          .insert({ 
            story_id: selectedTicket.key, 
            project_id: selectedTicket.projectId || '', 
            sprint_id: selectedTicket.sprintId || '',
            [column]: content 
          })
          .select();
          
        if (error) throw new Error(error.message);
        result = data;
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
    pushToJira
  };
};
