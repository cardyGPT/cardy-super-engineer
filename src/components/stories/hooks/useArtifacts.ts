
import { useState, useCallback } from 'react';
import { JiraTicket } from '@/types/jira';
import { supabase } from '@/lib/supabase';

export const useArtifacts = (ticket: JiraTicket | null) => {
  const [lldContent, setLldContent] = useState<string | null>(null);
  const [codeContent, setCodeContent] = useState<string | null>(null);
  const [testContent, setTestContent] = useState<string | null>(null);
  const [isLldGenerated, setIsLldGenerated] = useState(false);
  const [isCodeGenerated, setIsCodeGenerated] = useState(false);
  const [isTestsGenerated, setIsTestsGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkExistingArtifacts = useCallback(async () => {
    if (!ticket?.key) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Checking existing artifacts for ticket ${ticket.key}`);
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
        console.log('Found artifacts:', data);
        
        // Helper to ensure content is a string
        const ensureStringContent = (content: any) => {
          if (content === null || content === undefined) return null;
          return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        };
        
        // Set content and flags
        const lld = ensureStringContent(data.lld_content);
        const code = ensureStringContent(data.code_content);
        const tests = ensureStringContent(data.test_content);
        
        setLldContent(lld);
        setCodeContent(code);
        setTestContent(tests);
        
        setIsLldGenerated(!!lld);
        setIsCodeGenerated(!!code);
        setIsTestsGenerated(!!tests);
      } else {
        console.log('No artifacts found, resetting state');
        // Reset if no data found
        setLldContent(null);
        setCodeContent(null);
        setTestContent(null);
        setIsLldGenerated(false);
        setIsCodeGenerated(false);
        setIsTestsGenerated(false);
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

  return {
    lldContent,
    codeContent,
    testContent,
    isLldGenerated,
    isCodeGenerated,
    isTestsGenerated,
    loading,
    error,
    checkExistingArtifacts
  };
};
