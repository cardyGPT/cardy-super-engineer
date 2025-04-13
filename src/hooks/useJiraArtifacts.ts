
import { useState, useEffect, useCallback } from 'react';
import { JiraTicket } from '@/types/jira';
import { supabase } from '@/lib/supabase';

export interface JiraArtifacts {
  lldContent: string | null;
  codeContent: string | null;
  testContent: string | null;
  isLldGenerated: boolean;
  isCodeGenerated: boolean;
  isTestsGenerated: boolean;
}

export const useJiraArtifacts = (ticket: JiraTicket | null) => {
  const [artifacts, setArtifacts] = useState<JiraArtifacts>({
    lldContent: null,
    codeContent: null,
    testContent: null,
    isLldGenerated: false,
    isCodeGenerated: false,
    isTestsGenerated: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async () => {
    if (!ticket?.key) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('story_artifacts')
        .select('*')
        .eq('story_id', ticket.key)
        .maybeSingle();

      if (error) {
        console.error('Error fetching artifacts:', error);
        setError(error.message);
        return;
      }

      if (data) {
        setArtifacts({
          lldContent: data.lld_content || null,
          codeContent: data.code_content || null,
          testContent: data.test_content || null,
          isLldGenerated: !!data.lld_content,
          isCodeGenerated: !!data.code_content,
          isTestsGenerated: !!data.test_content
        });
      } else {
        // Reset if no data found
        setArtifacts({
          lldContent: null,
          codeContent: null,
          testContent: null,
          isLldGenerated: false,
          isCodeGenerated: false,
          isTestsGenerated: false
        });
      }
    } catch (err) {
      console.error('Error fetching artifacts:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error occurred while fetching artifacts');
      }
    } finally {
      setLoading(false);
    }
  }, [ticket]);

  // Fetch artifacts whenever ticket changes
  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  return {
    ...artifacts,
    loading,
    error,
    refreshArtifacts: fetchArtifacts
  };
};
