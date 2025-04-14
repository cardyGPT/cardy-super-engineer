
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
    
    // For agile and cloud API, use the /project endpoint
    let data;
    try {
      // Try the agile API first (most likely to work)
      data = await callJiraApi(
        credentials, 
        `project?startAt=${startAt}&maxResults=${maxResults}`
      );
    } catch (error) {
      console.error('Error with standard API, trying classic API:', error);
      // If that fails, try the classic API endpoint
      try {
        data = await callJiraApi(
          credentials,
          `project/search?startAt=${startAt}&maxResults=${maxResults}`
        );
        // Extract values array if it exists (classic API response format)
        if (data && data.values && Array.isArray(data.values)) {
          data = data.values;
        }
      } catch (classicError) {
        console.error('Error with classic API:', classicError);
        throw classicError;
      }
    }
    
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
