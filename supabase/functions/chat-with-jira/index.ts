
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Add request logging
  console.log(`Edge function 'chat-with-jira' received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Validate OpenAI API key
    if (!openAIApiKey) {
      console.error("OpenAI API key is missing");
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    
    // Log parsed request details for debugging
    console.log("Request data received:", {
      hasJiraTicket: !!requestBody.jiraTicket,
      hasDataModel: !!requestBody.dataModel,
      hasRequest: !!requestBody.request,
      documentCount: requestBody.documentsContext?.length || 0
    });

    // Extract data from request
    const { jiraTicket, dataModel, documentsContext, request } = requestBody;
    
    if (!jiraTicket || !request) {
      console.error("Missing required fields: jiraTicket or request");
      return new Response(
        JSON.stringify({ error: 'Jira ticket and request are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build a comprehensive prompt with the data model, jira ticket, and any documents
    let entities = [];
    let relationships = [];
    
    if (dataModel) {
      entities = dataModel.entities || [];
      relationships = dataModel.relationships || [];
      
      console.log(`Processing data model with ${entities.length} entities and ${relationships.length} relationships`);
    }
    
    // Construct the prompt in a structured way that's easy for GPT to understand
    const fullPrompt = `
# Jira Ticket Engineering Request

## JIRA TICKET
${JSON.stringify(jiraTicket, null, 2)}

## REQUEST
${request}

## DATA MODEL (${entities.length} entities, ${relationships.length} relationships)
${entities.length > 0 ? `
### ENTITIES
${entities.map(e => `
#### ${e.name} (${e.type || 'entity'})
Definition: ${e.definition || 'No definition provided'}

Attributes:
${e.attributes.map(a => `- ${a.name} (${a.type}${a.isPrimaryKey ? ', PK' : ''}${a.isForeignKey ? ', FK' : ''}): ${a.description || 'No description'}`).join('\n')}
`).join('\n')}

### RELATIONSHIPS
${relationships.map(r => {
  const sourceEntity = entities.find(e => e.id === r.sourceEntityId)?.name || r.sourceEntityId;
  const targetEntity = entities.find(e => e.id === r.targetEntityId)?.name || r.targetEntityId;
  return `- ${sourceEntity} → ${targetEntity}: ${r.name || 'Relationship'} (${r.sourceCardinality || '1'}:${r.targetCardinality || '1'}) - ${r.description || 'No description'}`;
}).join('\n')}
` : 'No data model provided.'}

${documentsContext ? `
## RELATED DOCUMENTS
${documentsContext}
` : ''}

Based on the Jira ticket, request, and the data model, please provide the following:
1. A Low-Level Design (LLD) document
2. Sample code implementation
3. Test cases to validate the implementation
4. Considerations for edge cases and error handling

Your response should be thorough and consider the data model constraints.`;

    console.log("Sending request to OpenAI");
    console.log("Prompt length:", fullPrompt.length);

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
            content: 'You are an expert software engineer specialized in translating Jira tickets into detailed technical specifications and code. You write clear, maintainable code and thorough test cases. Your responses should follow software engineering best practices and consider all aspects of the implementation including error handling and edge cases.'
          },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.2
      }),
    });

    // Log the response status
    console.log("OpenAI API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get response from OpenAI API', details: errorText }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log("OpenAI response received successfully");
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Invalid response format from OpenAI:", JSON.stringify(data).substring(0, 200));
      return new Response(
        JSON.stringify({ error: 'Invalid response from OpenAI' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const aiResponse = data.choices[0].message.content;
    console.log("AI Response generated, length:", aiResponse.length);

    // Return the successful response
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in chat-with-jira function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
