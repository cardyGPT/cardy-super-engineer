
import { JiraCredentials, JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';
import { supabase } from '@/lib/supabase';
import { callJiraApi, saveGeneratedContent } from './apiUtils';

export const generateJiraContent = async (
  ticket: JiraTicket,
  request: JiraGenerationRequest
): Promise<JiraGenerationResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('chat-with-jira', {
      body: {
        jiraTicket: ticket,
        dataModel: request.dataModel || null,
        documentsContext: request.documentsContext || null,
        request: request.type === 'lld' ? 'Generate a Low-Level Design' :
                request.type === 'code' ? 'Generate Implementation Code' :
                request.type === 'tests' ? 'Generate Test Cases' : 'Generate all content',
        projectContext: request.projectContext || null,
        selectedDocuments: request.selectedDocuments || []
      }
    });

    if (error) {
      console.error('Error generating content:', error);
      throw new Error(error.message || 'Failed to generate content');
    }

    // Save the generated content to our database
    try {
      await saveGeneratedContent(ticket.key, ticket.projectId, ticket.sprintId, request.type, data.response);
    } catch (saveError) {
      console.error('Error saving generated content:', saveError);
      // Continue even if saving fails
    }

    // Return the response based on the request type
    if (request.type === 'lld') {
      return { lld: data.response };
    } else if (request.type === 'code') {
      return { code: data.response };
    } else if (request.type === 'tests') {
      return { tests: data.response };
    } else {
      // Split the response into sections for 'all' type
      return {
        response: data.response,
        // Additional processing could be done here to extract sections
      };
    }
  } catch (error) {
    console.error('Error in generateJiraContent:', error);
    throw error;
  }
};

export const pushContentToJira = async (
  credentials: JiraCredentials,
  ticketId: string,
  content: string
): Promise<boolean> => {
  try {
    // Format content for Jira's ADFV2 format
    const formattedContent = {
      body: {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: content
              }
            ]
          }
        ]
      }
    };

    // Push to Jira as a comment
    await callJiraApi(
      credentials,
      `issue/${ticketId}/comment`,
      'POST',
      formattedContent
    );

    return true;
  } catch (error) {
    console.error('Error pushing content to Jira:', error);
    throw error;
  }
};
