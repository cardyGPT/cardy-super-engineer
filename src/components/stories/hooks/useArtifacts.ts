
import { useState, useEffect } from 'react';
import { JiraTicket } from '@/types/jira';
import { supabase } from '@/lib/supabase';

export interface StoryArtifacts {
  lldContent: string | null;
  codeContent: string | null;
  testContent: string | null;
  testCasesContent: string | null;
  lldGsuiteId?: string | null;
  codeGsuiteId?: string | null;
  testGsuiteId?: string | null;
  testCasesGsuiteId?: string | null;
}

export const useArtifacts = (storyId: string | null) => {
  const [artifacts, setArtifacts] = useState<StoryArtifacts>({
    lldContent: null,
    codeContent: null,
    testContent: null,
    testCasesContent: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!storyId) return;
    
    const fetchArtifacts = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('story_artifacts')
          .select('*')
          .eq('story_id', storyId)
          .maybeSingle();
        
        if (error) throw new Error(error.message);
        
        if (data) {
          setArtifacts({
            lldContent: data.lld_content,
            codeContent: data.code_content,
            testContent: data.test_content,
            testCasesContent: data.testcases_content,
            lldGsuiteId: data.lld_gsuite_id,
            codeGsuiteId: data.code_gsuite_id,
            testGsuiteId: data.test_gsuite_id,
            testCasesGsuiteId: data.testcases_gsuite_id
          });
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('An unknown error occurred'));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtifacts();
  }, [storyId]);
  
  return { ...artifacts, loading, error };
};
