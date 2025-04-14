
import { supabase } from '@/lib/supabase';
import { JiraCredentials, JiraProject } from '@/types/jira';
import { callJiraApi } from './apiUtils';

export const fetchJiraProjects = async (
  credentials: JiraCredentials, 
  startAt: number = 0, 
  maxResults: number = 50
): Promise<JiraProject[]> => {
  try {
    console.log('Fetching Jira projects with credentials...', {
      domain: credentials.domain,
      email: credentials.email,
      apiToken: credentials.apiToken ? '[REDACTED]' : 'missing',
      startAt,
      maxResults
    });
    
    const data = await callJiraApi(
      credentials, 
      `project?startAt=${startAt}&maxResults=${maxResults}`
    );
    
    console.log('Jira projects API response:', data);
    
    if (!data || !Array.isArray(data)) {
      console.error('Invalid response format from Jira API:', data);
      throw new Error('Invalid response format from Jira API');
    }
    
    // Transform the response into our JiraProject format
    return data.map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      avatarUrl: project.avatarUrls?.['48x48'],
      domain: credentials.domain
    }));
  } catch (error) {
    console.error('Error fetching Jira projects:', error);
    throw error;
  }
};

// Function to fetch all projects with pagination
export const fetchAllJiraProjects = async (credentials: JiraCredentials): Promise<JiraProject[]> => {
  try {
    let allProjects: JiraProject[] = [];
    let startAt = 0;
    const maxResults = 50;
    let hasMore = true;
    
    console.log('Fetching all Jira projects with pagination...');
    
    while (hasMore) {
      const projects = await fetchJiraProjects(credentials, startAt, maxResults);
      allProjects = [...allProjects, ...projects];
      
      console.log(`Fetched batch of ${projects.length} projects, total so far: ${allProjects.length}`);
      
      // If we received fewer projects than maxResults, we've reached the end
      if (projects.length < maxResults) {
        hasMore = false;
      } else {
        startAt += maxResults;
      }
    }
    
    console.log(`Finished fetching all ${allProjects.length} projects`);
    return allProjects;
  } catch (error) {
    console.error('Error fetching all Jira projects:', error);
    throw error;
  }
};

// Function to test Jira connection and determine API version (Classic or Agile)
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
