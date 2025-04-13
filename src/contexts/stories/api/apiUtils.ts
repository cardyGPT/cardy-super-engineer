
import { supabase } from '@/lib/supabase';
import { JiraCredentials } from '@/types/jira';

// Set this to true to enable test data when API calls fail
export const DEV_MODE = true; 

// Helper function to fetch from Jira API through our edge function
export const callJiraApi = async (credentials: JiraCredentials, path: string, method: string = 'GET', data?: any) => {
  const { domain, email, apiToken } = credentials;
  
  try {
    console.log(`Calling Jira API with path: ${path}`);
    const { data: responseData, error: supabaseError } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        path,
        method,
        data
      }
    });

    if (supabaseError) {
      console.error('Supabase functions invoke error:', supabaseError);
      throw new Error(supabaseError.message || 'Failed to call Jira API via edge function');
    }

    // Check if the response contains error information
    if (responseData?.error) {
      console.error('Jira API returned an error:', responseData.error);
      console.error('Error details:', responseData.details);
      console.error('Requested URL:', responseData.url);
      
      // Throw a detailed error
      throw new Error(responseData.error || 'Error from Jira API');
    }

    return responseData;
  } catch (error) {
    console.error('Error in callJiraApi:', error);
    throw error;
  }
};

// Helper function to save generated content to the database
export const saveGeneratedContent = async (
  storyId: string, 
  projectId: string | undefined, 
  sprintId: string | undefined, 
  contentType: string, 
  content: string
) => {
  if (!storyId || !contentType || !content) return;

  try {
    const { data, error } = await supabase.functions.invoke('save-story-artifacts', {
      body: {
        storyId,
        projectId,
        sprintId,
        contentType, 
        content
      }
    });

    if (error) {
      console.error('Error saving generated content:', error);
      throw new Error(error.message || 'Failed to save generated content');
    }

    return data;
  } catch (error) {
    console.error('Error in saveGeneratedContent:', error);
    throw error;
  }
};
