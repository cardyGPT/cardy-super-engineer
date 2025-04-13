
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Validate OpenAI configuration
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request
    const { jiraTicket, dataModel, documentsContext, request, projectContext, selectedDocuments } = await req.json();
    
    if (!jiraTicket) {
      return new Response(
        JSON.stringify({ error: 'Jira ticket information is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize OpenAI
    const configuration = new Configuration({ apiKey: openAIApiKey });
    const openai = new OpenAIApi(configuration);

    // Prepare context for the model
    let ticketContext = `
Jira Ticket: ${jiraTicket.key}
Summary: ${jiraTicket.summary || 'No summary provided'}
Description: ${jiraTicket.description || 'No description provided'}
Status: ${jiraTicket.status || 'Unknown'}
Priority: ${jiraTicket.priority || 'Unknown'}
`;

    // Add any additional contexts
    if (dataModel) {
      ticketContext += `\nData Model Context:\n${typeof dataModel === 'string' ? dataModel : JSON.stringify(dataModel, null, 2)}`;
    }

    if (documentsContext) {
      ticketContext += `\nDocuments Context:\n${typeof documentsContext === 'string' ? documentsContext : JSON.stringify(documentsContext, null, 2)}`;
    }

    if (projectContext) {
      ticketContext += `\nProject Context:\n${typeof projectContext === 'string' ? projectContext : JSON.stringify(projectContext, null, 2)}`;
    }

    if (selectedDocuments && selectedDocuments.length > 0) {
      ticketContext += `\nSelected Documents:\n${typeof selectedDocuments === 'string' ? selectedDocuments : JSON.stringify(selectedDocuments, null, 2)}`;
    }

    // Determine prompt based on request type
    let systemPrompt = "You are an AI assistant specialized in software development.";
    let userPrompt = "";

    if (request.includes('LLD') || request.includes('Low-Level Design')) {
      systemPrompt = "You are a senior software architect. Create a detailed low-level design document for the following user story.";
      userPrompt = `Create a comprehensive low-level design document for this Jira ticket. Use the following information as context:\n\n${ticketContext}\n\nInclude the following sections:\n1. Overview\n2. Component Breakdown\n3. Data Models\n4. API Endpoints\n5. Sequence Diagrams (in text format)\n6. Error Handling\n7. Security Considerations\n\nUse proper markdown formatting with headers, lists, and code blocks where appropriate.`;
    } else if (request.includes('code') || request.includes('implementation')) {
      systemPrompt = "You are a senior software developer. Generate production-ready code for the following user story.";
      userPrompt = `Generate production-ready code for this Jira ticket. Use the following information as context:\n\n${ticketContext}\n\nPlease include:\n1. Frontend AngularJS code\n2. Backend Node.js code\n3. PostgreSQL database scripts (including stored procedures, triggers, and functions)\n\nEnsure the code follows best practices, includes error handling, and is well-documented. Use markdown code blocks with language syntax highlighting.`;
    } else if (request.includes('test') || request.includes('testing')) {
      systemPrompt = "You are a QA automation expert. Create comprehensive test cases for the following user story.";
      userPrompt = `Create comprehensive test cases for this Jira ticket. Use the following information as context:\n\n${ticketContext}\n\nInclude:\n1. Unit Tests\n2. Integration Tests\n3. End-to-End Tests\n4. Edge Cases\n5. Performance Test Considerations\n\nFormat your response with proper markdown and code examples where applicable.`;
    } else {
      userPrompt = `Based on the following Jira ticket information, generate the requested content:\n\n${ticketContext}\n\nRequest: ${request}`;
    }

    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      frequency_penalty: 0,
      presence_penalty: 0.2,
    });

    // Extract and return the response
    const aiResponse = response.data.choices[0].message?.content || "No response generated";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in chat-with-jira function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred processing the request" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
