import { supabase } from '@/lib/supabase';
import { JiraCredentials } from '@/types/jira';

// Development mode flag
export const DEV_MODE = process.env.NODE_ENV === 'development';

// Helper function to ensure a value is a string
export const ensureString = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    console.error('Error stringifying value:', e);
    return String(value);
  }
};

// Call the Jira API with proper authentication
export const callJiraApi = async (
  credentials: JiraCredentials,
  endpoint: string,
  method: string = 'GET',
  data?: any
) => {
  const { domain, email, apiToken } = credentials;
  
  // Ensure domain doesn't have trailing slash
  const baseDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
  
  // Construct the full URL
  const url = `${baseDomain}/rest/api/2/${endpoint}`;
  
  // Create authorization header with Base64 encoded credentials
  const auth = btoa(`${email}:${apiToken}`);
  
  // Set up request options
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  // Add body for non-GET requests
  if (method !== 'GET' && data) {
    options.body = JSON.stringify(data);
  }
  
  // Make the request
  const response = await fetch(url, options);
  
  // Check if the response is OK
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Jira API error (${response.status}):`, errorText);
    throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
  }
  
  // Parse and return the response
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('Error parsing Jira API response:', error);
    throw new Error('Failed to parse Jira API response');
  }
};

// Test Jira connection
export const testJiraConnection = async (credentials: JiraCredentials): Promise<boolean> => {
  try {
    // Try to fetch the current user as a simple test
    await callJiraApi(credentials, 'myself');
    return true;
  } catch (error) {
    console.error('Jira connection test failed:', error);
    return false;
  }
};

// Save generated content to the database
export const saveGeneratedContent = async (
  storyId: string,
  projectId: string,
  sprintId: string,
  contentType: string,
  content: string
): Promise<void> => {
  try {
    // Call the save-story-artifacts function
    const { error } = await supabase.functions.invoke('save-story-artifacts', {
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
      throw new Error('Failed to save generated content');
    }
  } catch (error) {
    console.error('Error in saveGeneratedContent:', error);
    throw error;
  }
};

// Sanitize content for React rendering
export const sanitizeContentForReact = (content: string): string => {
  // Prevent potential XSS attacks and ensure content is safe for React
  if (!content) return '';
  
  // Basic sanitization - you can expand this based on your needs
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, 'removed:');
};

// Sanitize HTML content
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Remove potentially dangerous tags and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, 'removed:')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/on\w+=\w+/gi, '');
};
