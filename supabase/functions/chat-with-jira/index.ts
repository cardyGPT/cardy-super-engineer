
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
    
    // Get the OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Parse request body
    const { jiraTicket, dataModel, documentsContext, request, projectContext, selectedDocuments, additionalContext } = await req.json();
    
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

    // Determine generation type from the request
    let contentType = 'general';
    if (request) {
      const requestLower = request.toLowerCase();
      if (requestLower.includes('low-level design') || requestLower.includes('lld')) {
        contentType = 'lld';
      } else if (requestLower.includes('code') || requestLower.includes('implementation')) {
        contentType = 'code';
      } else if (requestLower.includes('test') || requestLower.includes('qa')) {
        contentType = 'tests';
      }
    }

    // Get the system prompt based on content type
    let systemPrompt = '';
    switch (contentType) {
      case 'lld':
        systemPrompt = `You are an expert software architect. Create a detailed low-level design document based on the provided Jira ticket. 
        Include component diagrams, data flow, API contracts, and database schema changes if applicable. 
        Format your response using Markdown for easy readability.`;
        break;
      
      case 'code':
        systemPrompt = `You are an expert software developer. Based on the provided Jira ticket and any design information, 
        generate the necessary code implementation. Include all relevant files, classes, methods, and tests that would be needed. 
        Focus on producing clean, maintainable, and well-documented code.
        Use Markdown code blocks with appropriate language syntax highlighting.`;
        break;
      
      case 'tests':
        systemPrompt = `You are an expert QA engineer. Based on the provided Jira ticket, create comprehensive test cases to validate the feature.
        Include both unit tests and integration tests where appropriate. Cover edge cases, error scenarios, and performance considerations.
        Format your response using Markdown, with clear sections for different test categories.`;
        break;
      
      default:
        systemPrompt = `You are a helpful assistant for software development teams. Provide a detailed and comprehensive response to the user's request.`;
    }

    // Call the OpenAI API
    console.log(`Calling OpenAI API for ${contentType} generation...`);
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
            content: `${request || `Generate ${contentType} for the following Jira ticket`}:\n\n${ticketContext}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Error calling OpenAI API");
    }
    
    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Return the generated content
    return new Response(
      JSON.stringify({ response: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
