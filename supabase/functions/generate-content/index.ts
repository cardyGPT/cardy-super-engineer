
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { prompt, systemPrompt, ticketData, contentType, projectContext, maxTokens = 2000, temperature = 0.7 } = await req.json();
    
    // Validate request
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
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
    
    // Create a rich context based on the ticket data and context
    const enhancedPrompt = createEnhancedPrompt(prompt, ticketData, contentType, projectContext);
    
    // Call the OpenAI API
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
            content: systemPrompt || getDefaultSystemPrompt(contentType)
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Error calling OpenAI API");
    }
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        content: data.choices[0].message.content,
        usage: data.usage
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error generating content:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// Helper functions to create enhanced prompts and system prompts
function createEnhancedPrompt(basePrompt: string, ticketData: any, contentType: string, projectContext: any): string {
  let enhancedPrompt = basePrompt;
  
  if (ticketData) {
    enhancedPrompt += `\n\n### Jira Ticket Details:\n`;
    enhancedPrompt += `- Key: ${ticketData.key}\n`;
    enhancedPrompt += `- Summary: ${ticketData.summary}\n`;
    
    if (ticketData.description) {
      enhancedPrompt += `\n### Description:\n${ticketData.description}\n`;
    }
    
    if (ticketData.acceptance_criteria) {
      enhancedPrompt += `\n### Acceptance Criteria:\n${ticketData.acceptance_criteria}\n`;
    }
    
    if (ticketData.status) {
      enhancedPrompt += `\n- Status: ${ticketData.status}\n`;
    }
    
    if (ticketData.priority) {
      enhancedPrompt += `- Priority: ${ticketData.priority}\n`;
    }
  }
  
  if (projectContext) {
    enhancedPrompt += `\n\n### Project Context:\n${JSON.stringify(projectContext, null, 2)}\n`;
  }
  
  return enhancedPrompt;
}

function getDefaultSystemPrompt(contentType: string): string {
  switch (contentType) {
    case 'lld':
      return `You are an expert software architect. Create a detailed low-level design document based on the provided Jira ticket. 
      Include component diagrams, data flow, API contracts, and database schema changes if applicable. 
      Format your response using Markdown for easy readability.`;
    
    case 'code':
      return `You are an expert software developer. Based on the provided Jira ticket and any design information, 
      generate the necessary code implementation. Include all relevant files, classes, methods, and tests that would be needed. 
      Focus on producing clean, maintainable, and well-documented code.
      Use Markdown code blocks with appropriate language syntax highlighting.`;
    
    case 'tests':
      return `You are an expert QA engineer. Based on the provided Jira ticket, create comprehensive test cases to validate the feature.
      Include both unit tests and integration tests where appropriate. Cover edge cases, error scenarios, and performance considerations.
      Format your response using Markdown, with clear sections for different test categories.`;
    
    default:
      return `You are a helpful assistant for software development teams. Provide a detailed and comprehensive response to the user's request.`;
  }
}
