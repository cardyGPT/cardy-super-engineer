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

// Function to test Jira connection and determine API version
export const testJiraConnection = async (credentials: JiraCredentials): Promise<{
  isConnected: boolean;
  userName?: string;
  apiVersion?: 'classic' | 'agile' | 'cloud';
  errorMessage?: string;
}> => {
  try {
    // First test basic connection by fetching user information
    const userData = await callJiraApi(credentials, 'myself');
    
    if (!userData || !userData.displayName) {
      return { 
        isConnected: false,
        errorMessage: 'Could not retrieve user information' 
      };
    }
    
    // Next, test if Agile features are available
    try {
      const agileData = await callJiraApi(credentials, 'agile/1.0/board');
      
      return {
        isConnected: true,
        userName: userData.displayName,
        apiVersion: 'agile'
      };
    } catch (agileError) {
      // If agile API fails, check if it's a newer cloud instance
      try {
        const cloudTest = await callJiraApi(credentials, 'platform/capabilities');
        
        return {
          isConnected: true,
          userName: userData.displayName,
          apiVersion: 'cloud'
        };
      } catch (cloudError) {
        // If both fail, assume it's classic Jira
        return {
          isConnected: true,
          userName: userData.displayName,
          apiVersion: 'classic'
        };
      }
    }
  } catch (error) {
    console.error('Error testing Jira connection:', error);
    return {
      isConnected: false,
      errorMessage: error.message || 'Failed to connect to Jira'
    };
  }
};

// Function to sanitize content for React rendering
export const sanitizeContentForReact = (content: any): string => {
  if (content === null || content === undefined) {
    return '';
  }
  
  if (typeof content === 'string') {
    return content;
  }
  
  if (typeof content === 'object') {
    // Check if it's an object with type, version, content structure (Jira custom format)
    if (content.type && content.version && content.content) {
      try {
        // Extract plain text from Jira's Atlassian Document Format
        let plainText = '';
        const extractText = (items: any[]) => {
          if (!Array.isArray(items)) return;
          items.forEach(item => {
            if (item.type === 'paragraph' && item.content) {
              extractText(item.content);
              plainText += '\n\n';
            } else if (item.type === 'text' && item.text) {
              plainText += item.text;
            } else if (item.type === 'bulletList' && item.content) {
              extractText(item.content);
            } else if (item.type === 'listItem' && item.content) {
              plainText += '- ';
              extractText(item.content);
            } else if (item.content && Array.isArray(item.content)) {
              extractText(item.content);
            }
          });
        };
        
        extractText(content.content);
        return plainText.trim();
      } catch (e) {
        console.error('Error extracting text from Atlassian Document Format:', e);
        return JSON.stringify(content);
      }
    }
    
    try {
      return JSON.stringify(content, null, 2);
    } catch (e) {
      console.error('Error stringifying object:', e);
      return '[Complex object]';
    }
  }
  
  return String(content);
};
