
import { supabase } from '@/lib/supabase';
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse, JiraCredentials } from '@/types/jira';
import { DEV_MODE, callJiraApi, ensureString, saveGeneratedContent } from './apiUtils';

// Generate content for a specific Jira ticket
export const generateJiraContent = async (
  ticket: JiraTicket,
  request: JiraGenerationRequest
): Promise<JiraGenerationResponse> => {
  try {
    console.log(`Generating ${request.type} content for ${ticket.key}`);
    
    // Add ticket details to request object if not already present
    if (!request.jiraTicket) {
      request.jiraTicket = ticket;
    }
    
    // Call the Supabase function to generate content
    const { data, error } = await supabase.functions.invoke('chat-with-jira', {
      body: {
        jiraTicket: ticket,
        request: `Generate ${request.type} for this ticket`,
        projectContext: request.projectContext,
        selectedDocuments: request.selectedDocuments,
        additionalContext: request.additionalContext
      }
    });

    if (error) {
      console.error('Error generating content:', error);
      throw new Error(error.message || 'Failed to generate content');
    }

    if (!data || !data.response) {
      throw new Error('No response received from content generation service');
    }
    
    // Ensure response is a string
    const responseContent = ensureString(data.response);
    
    // Create a response object with the generated content
    // For 'all' type, we'll still return it in the correct content field instead of using 'all'
    let response: JiraGenerationResponse = {};
    
    if (request.type === 'lld') {
      response.lld = responseContent;
    } else if (request.type === 'code') {
      response.code = responseContent;
    } else if (request.type === 'tests') {
      response.tests = responseContent;
    } else if (request.type === 'all') {
      // For 'all' type, put the content in the lld field by default
      // In a real implementation, you might want to split this into different parts
      response.lld = responseContent;
    }
    
    // Also include the full response for reference
    response.response = responseContent;
    
    // Save the generated content to the database
    try {
      if (ticket.key && ticket.projectId) {
        await saveGeneratedContent(
          ticket.key,
          ticket.projectId || '',
          ticket.sprintId || '',
          request.type,
          responseContent
        );
      }
    } catch (saveError) {
      console.error('Error saving generated content:', saveError);
      // Continue even if saving fails
    }
    
    return response;
  } catch (err: any) {
    console.error('Error in generateJiraContent:', err);
    throw err;
  }
};

// Push content to Jira as a comment
export const pushContentToJira = async (
  credentials: JiraCredentials,
  ticketId: string,
  content: string
): Promise<boolean> => {
  try {
    if (!ticketId || !content) {
      throw new Error('Missing required parameters for pushing to Jira');
    }
    
    console.log(`Pushing content to Jira ticket ${ticketId}...`);
    
    // Ensure content is a string
    const safeContent = ensureString(content);
    
    // Convert markdown to Jira markup (a basic conversion)
    const jiraContent = safeContent
      .replace(/^# (.*$)/gm, 'h1. $1')
      .replace(/^## (.*$)/gm, 'h2. $1')
      .replace(/^### (.*$)/gm, 'h3. $1')
      .replace(/^#### (.*$)/gm, 'h4. $1')
      .replace(/^##### (.*$)/gm, 'h5. $1')
      .replace(/^###### (.*$)/gm, 'h6. $1')
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/\*(.*?)\*/g, '_$1_')
      .replace(/`{3}([\s\S]*?)`{3}/g, '{code}$1{code}')
      .replace(/`([^`]+)`/g, '{{$1}}');
    
    // Call the Jira API to add a comment
    await callJiraApi(
      credentials,
      `issue/${ticketId}/comment`,
      'POST',
      {
        body: jiraContent
      }
    );
    
    return true;
  } catch (err) {
    console.error('Error in pushContentToJira:', err);
    throw err;
  }
};
