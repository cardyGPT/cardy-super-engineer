import { supabase } from '@/lib/supabase';
import { JiraCredentials, JiraProject } from '@/types/jira';

// Development mode flag for testing
export const DEV_MODE = false;

// Call the Jira API via our Supabase edge function
export const callJiraApi = async (
  credentials: JiraCredentials,
  path: string,
  method: string = 'GET',
  data?: any
) => {
  try {
    console.log(`Calling Jira API: ${path} (${method})`);
    
    const { data: responseData, error } = await supabase.functions.invoke('jira-api', {
      body: {
        domain: credentials.domain,
        email: credentials.email,
        apiToken: credentials.apiToken,
        path,
        method,
        data
      }
    });
    
    if (error) {
      console.error('Error calling Jira API via edge function:', error);
      throw new Error(`Edge function error: ${error.message}`);
    }
    
    // If the API itself returned an error, it will be in responseData.error
    if (responseData && responseData.error) {
      console.error('Jira API returned error:', responseData);
      throw new Error(responseData.error);
    }
    
    return responseData;
  } catch (err) {
    console.error(`Error in callJiraApi (${path}):`, err);
    throw err;
  }
};

// Test Jira connection and determine API version
export const testJiraConnection = async (credentials: JiraCredentials) => {
  try {
    // Try agile API first (most common for newer Jira instances)
    try {
      console.log('Testing Jira connection with Agile API...');
      const data = await callJiraApi(credentials, 'agile/1.0/board');
      
      if (data && !data.error) {
        console.log('Successfully connected using Agile API');
        return { isConnected: true, apiVersion: 'agile' as const };
      }
    } catch (agileError) {
      console.log('Agile API test failed, trying Cloud API next...');
    }
    
    // Try cloud API next
    try {
      const data = await callJiraApi(credentials, 'api/2/myself');
      
      if (data && !data.error) {
        console.log('Successfully connected using Cloud API');
        return { isConnected: true, apiVersion: 'cloud' as const };
      }
    } catch (cloudError) {
      console.log('Cloud API test failed, falling back to Classic API...');
    }
    
    // Finally try classic API
    const data = await callJiraApi(credentials, 'project');
    
    if (data && !data.error) {
      console.log('Successfully connected using Classic API');
      return { isConnected: true, apiVersion: 'classic' as const };
    }
    
    return { isConnected: false, apiVersion: null };
  } catch (error) {
    console.error('Error testing Jira connection:', error);
    return { isConnected: false, apiVersion: null };
  }
};

// Ensure all content is properly converted to string
export const ensureString = (content: any): string => {
  if (typeof content === 'string') {
    return content;
  }
  
  if (content === null || content === undefined) {
    return '';
  }
  
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content);
    } catch (e) {
      return String(content);
    }
  }
  
  return String(content);
};

// Function to extract JQL from a Jira URL
export const extractJqlFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('jql');
  } catch (e) {
    console.error('Error parsing URL:', e);
    return null;
  }
};

// Helper to extract error message from complex error objects
export const extractErrorMessage = (error: any): string => {
  if (!error) {
    return 'Unknown error occurred';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  // Check for response error format from Jira
  if (error.response && error.response.data) {
    const { data } = error.response;
    
    if (data.errorMessages && data.errorMessages.length > 0) {
      return data.errorMessages[0];
    }
    
    if (data.message) {
      return data.message;
    }
  }
  
  // Check for fetch error or axios error
  if (error.message) {
    return error.message;
  }
  
  // Fallback
  return 'An error occurred with the Jira API';
};

// Sanitize HTML content (for safety when rendering)
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Replace potentially dangerous tags
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, 'data-disabled-event=');
};

// Save generated content to database (used in contentApi.ts)
export const saveGeneratedContent = async (
  storyId: string,
  projectId: string,
  sprintId: string,
  contentType: string,
  content: string
): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('save-story-artifacts', {
      body: {
        storyId,
        projectId,
        sprintId,
        contentType,
        content: ensureString(content)
      }
    });
    
    if (error) {
      console.error('Error saving generated content:', error);
      throw new Error(error.message || 'Failed to save generated content');
    }
  } catch (err) {
    console.error('Error in saveGeneratedContent:', err);
    throw err;
  }
};

// Sanitize content for rendering in React components
export const sanitizeContentForReact = (content: any): string => {
  // Check if content is null or undefined
  if (content === null || content === undefined) {
    return '';
  }
  
  // Ensure content is a string before calling string methods
  const contentStr = ensureString(content);
  
  // Replace HTML entities and other problematic characters
  return contentStr
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\r\n/g, '\n'); // Normalize line endings
};
