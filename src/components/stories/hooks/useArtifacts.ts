
import { useState, useCallback } from 'react';
import { JiraTicket } from '@/types/jira';
import { supabase } from '@/lib/supabase';

export const useArtifacts = (ticket: JiraTicket | null) => {
  const [lldContent, setLldContent] = useState<string | null>(null);
  const [codeContent, setCodeContent] = useState<string | null>(null);
  const [testContent, setTestContent] = useState<string | null>(null);
  const [isLldGenerated, setIsLldGenerated] = useState<boolean>(false);
  const [isCodeGenerated, setIsCodeGenerated] = useState<boolean>(false);
  const [isTestsGenerated, setIsTestsGenerated] = useState<boolean>(false);

  const checkExistingArtifacts = useCallback(async () => {
    if (!ticket) {
      // Reset state when no ticket selected
      setLldContent(null);
      setCodeContent(null);
      setTestContent(null);
      setIsLldGenerated(false);
      setIsCodeGenerated(false);
      setIsTestsGenerated(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('story_artifacts')
        .select('*')
        .eq('story_id', ticket.key)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing artifacts:', error);
        return;
      }

      if (data) {
        if (data.lld_content) {
          setLldContent(data.lld_content);
          setIsLldGenerated(true);
        }
        
        if (data.code_content) {
          setCodeContent(data.code_content);
          setIsCodeGenerated(true);
        }
        
        if (data.test_content) {
          setTestContent(data.test_content);
          setIsTestsGenerated(true);
        }
      }
    } catch (err) {
      console.error('Error checking artifacts:', err);
    }
  }, [ticket]);

  return {
    lldContent,
    codeContent,
    testContent,
    isLldGenerated,
    isCodeGenerated,
    isTestsGenerated,
    checkExistingArtifacts
  };
};
