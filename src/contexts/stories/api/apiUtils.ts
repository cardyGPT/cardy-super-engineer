
import { supabase } from '@/lib/supabase';
import { JiraCredentials } from '@/types/jira';

// Set this to true to enable test data when API calls fail
export const DEV_MODE = false;

// Helper function to fetch from Jira API through our edge function
export const callJiraApi = async (credentials: JiraCredentials, path: string, method: string = 'GET', data?: any) => {
  const { domain, email, apiToken } = credentials;
  
  try {
    console.log(`Calling Jira API with path: ${path}, method: ${method}`);
    console.log(`Using credentials for domain: ${domain}, email: ${email}, token type: Classic API Token`);
    
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
      
      // Handle potential authentication issues
      if (responseData.status === 401 || (responseData.details && responseData.details.message && responseData.details.message.includes('Unauthorized'))) {
        throw new Error('Authentication failed. Please check your Jira credentials.');
      }
      
      // Throw a detailed error
      throw new Error(responseData.error || 'Error from Jira API');
    }

    return responseData;
  } catch (error) {
    console.error('Error in callJiraApi:', error);
    throw error;
  }
};

// Function to evaluate Jira expressions for a specific issue
export const evaluateJiraExpression = async (credentials: JiraCredentials, issueKey: string, expression: string) => {
  const { domain, email, apiToken } = credentials;
  
  try {
    console.log(`Evaluating Jira expression for issue ${issueKey}: ${expression}`);
    
    const { data: responseData, error: supabaseError } = await supabase.functions.invoke('jira-api', {
      body: {
        domain,
        email,
        apiToken,
        path: 'expression/eval',
        method: 'POST',
        data: {
          expression,
          context: {
            issue: {
              key: issueKey
            }
          }
        }
      }
    });

    if (supabaseError) {
      console.error('Supabase functions invoke error:', supabaseError);
      throw new Error(supabaseError.message || 'Failed to evaluate Jira expression');
    }

    // Check if the response contains error information
    if (responseData?.error) {
      console.error('Jira Expression API returned an error:', responseData.error);
      console.error('Error details:', responseData.details);
      
      // Handle Jira Classic case where expression API might not be available
      if (responseData.status === 404 || (responseData.details && responseData.details.message && responseData.details.message.includes('not found'))) {
        console.warn('Expression API not available - possibly using Jira Classic');
        return null;
      }
      
      // Throw a detailed error
      throw new Error(responseData.error || 'Error from Jira Expression API');
    }

    return responseData?.value;
  } catch (error) {
    console.error('Error in evaluateJiraExpression:', error);
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

// Check if a value is a string
export const isString = (value: any): boolean => {
  return typeof value === 'string' || value instanceof String;
};

// Safely convert any value to a string
export const ensureString = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (isString(value)) {
    return value as string;
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      console.error('Error stringifying object:', e);
      return '[Object conversion error]';
    }
  }
  
  return String(value);
};
