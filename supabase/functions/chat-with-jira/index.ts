
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

// Helper function to safely convert any content to string
const safeStringify = (content: any): string => {
  if (content === null || content === undefined) {
    return "";
  }
  
  if (typeof content === 'string') {
    return content;
  }
  
  // Handle Jira document format or any object
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch (e) {
      console.error("Error stringifying content:", e);
      return "[Content conversion error]";
    }
  }
  
  return String(content);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    // Parse request body
    const { jiraTicket, dataModel, documentsContext, request, projectContext, selectedDocuments, additionalContext, type } = await req.json();
    
    if (!jiraTicket) {
      return new Response(
        JSON.stringify({ error: 'Jira ticket information is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare context for the model
    let ticketContext = `
Jira Ticket: ${jiraTicket.key || 'Unknown'}
Summary: ${safeStringify(jiraTicket.summary) || 'No summary provided'}
Description: ${safeStringify(jiraTicket.description) || 'No description provided'}
Status: ${safeStringify(jiraTicket.status) || 'Unknown'}
Priority: ${safeStringify(jiraTicket.priority) || 'Unknown'}
Type: ${safeStringify(jiraTicket.issuetype?.name) || 'Unknown'}
`;

    if (jiraTicket.acceptance_criteria) {
      ticketContext += `\nAcceptance Criteria: ${safeStringify(jiraTicket.acceptance_criteria)}`;
    }

    // Add any additional contexts
    if (dataModel) {
      ticketContext += `\nData Model Context:\n${safeStringify(dataModel)}`;
    }

    if (documentsContext) {
      ticketContext += `\nDocuments Context:\n${safeStringify(documentsContext)}`;
    }

    // Include sprint and epic information if available
    if (additionalContext?.sprint) {
      ticketContext += `\nSprint Information:\n${safeStringify(additionalContext.sprint)}`;
    }
    
    if (additionalContext?.epic) {
      ticketContext += `\nEpic Information:\n${safeStringify(additionalContext.epic)}`;
    }

    // If projectContext is provided, fetch the project and documents info
    if (projectContext) {
      try {
        // Get project info
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, name, type')
          .eq('id', projectContext)
          .single();
        
        if (projectError) throw projectError;
        
        ticketContext += `\nProject Context:\nProject: ${projectData.name} (${projectData.type})`;
        
        // Get document info if selectedDocuments is provided
        if (selectedDocuments && selectedDocuments.length > 0) {
          const { data: documentsData, error: documentsError } = await supabase
            .from('documents')
            .select('id, name, type')
            .in('id', selectedDocuments);
          
          if (documentsError) throw documentsError;
          
          if (documentsData && documentsData.length > 0) {
            ticketContext += `\n\nReference Documents:`;
            documentsData.forEach(doc => {
              ticketContext += `\n- ${doc.name} (${doc.type})`;
            });
          }
        }
      } catch (contextError) {
        console.error("Error fetching context:", contextError);
        // Continue even if context fetch fails
      }
    }

    // Create the system prompt based on the content type
    let systemPrompt = "";
    
    if (type === 'lld') {
      systemPrompt = `You are an expert software architect who creates detailed low-level design documents.
Based on the Jira ticket information, create a comprehensive low-level design document.
Include component breakdowns, data models, API endpoints, sequence diagrams, error handling, and security considerations.
Format everything properly in markdown with clear headings, code blocks, and diagrams.
Your response should be detailed, structured, and directly usable in a technical documentation system.`;
    } 
    else if (type === 'code') {
      systemPrompt = `You are an expert software developer specializing in AngularJS (frontend), NodeJS (backend), and PostgreSQL.
Based on the Jira ticket information, create implementation code that addresses the requirements.
Include all necessary components, services, and utility functions.
Structure your code following best practices, with clear comments and error handling.
Format everything properly in markdown with appropriate syntax highlighting.
Your code should be complete, well-structured, and ready for review.`;
    } 
    else if (type === 'tests') {
      systemPrompt = `You are an expert in software testing with experience in unit tests, integration tests, and end-to-end tests.
Based on the Jira ticket information, create comprehensive test code using Playwright.
Include unit tests, integration tests, end-to-end tests, edge cases, and performance test considerations.
Format everything properly in markdown with clear test scenarios and expected results.
Your tests should be thorough, covering all aspects of the functionality described in the ticket.`;
    } 
    else if (type === 'testcases') {
      systemPrompt = `You are an expert in software testing with experience in quality assurance and test case design.
Based on the Jira ticket information, create a comprehensive set of test cases that could be executed manually.
Include positive tests, negative tests, edge cases, and user experience tests.
Format everything properly in markdown with clear test steps, expected results, and preconditions.
Your test cases should be thorough, covering all aspects of the functionality described in the ticket.`;
    }
    else {
      systemPrompt = `You are an expert software development assistant.
Analyze the Jira ticket information and provide a comprehensive response addressing the requirements.
Format your response cleanly and professionally in markdown.
Your response should be detailed, structured and directly usable by the development team.`;
    }

    // Call OpenAI API
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `${ticketContext}\n\nPlease generate a detailed, well-formatted ${
                type === 'lld' ? 'low-level design document' : 
                type === 'code' ? 'implementation code' : 
                type === 'tests' ? 'test code using Playwright' : 
                type === 'testcases' ? 'manual test cases' : 
                'response'
              } based on this Jira ticket information.`
            }
          ],
          temperature: 0.5,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const responseContent = data.choices[0].message.content;

      // Return the generated content
      return new Response(
        JSON.stringify({ response: responseContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (openAIError) {
      console.error("Error calling OpenAI API:", openAIError);
      throw new Error(`Failed to generate content: ${openAIError.message}`);
    }
  } catch (error) {
    console.error("Error in chat-with-jira function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred processing the request",
        response: "Error occurred while generating content. Please try again." 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
