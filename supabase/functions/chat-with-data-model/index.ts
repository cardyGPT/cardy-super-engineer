
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Add request logging
  console.log(`Edge function 'chat-with-data-model' received ${req.method} request`);
  
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
          headers: corsHeaders
        }
      );
    }

    // Log request details for debugging
    const requestText = await req.text();
    console.log("Request body received:", requestText);
    
    let requestBody;
    try {
      requestBody = JSON.parse(requestText);
      console.log("Parsed request data:", {
        hasMessage: !!requestBody.message,
        hasDataModel: !!requestBody.dataModel,
        messageLength: requestBody.message?.length || 0,
        entityCount: requestBody.dataModel?.entities?.length || 0
      });
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    // Extract data from request
    const { message, dataModel, documentsContext } = requestBody;
    
    if (!message) {
      console.error("Missing required field: message");
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    // Build a comprehensive prompt with the data model and any documents
    let entities = [];
    let relationships = [];
    
    if (dataModel) {
      entities = dataModel.entities || [];
      relationships = dataModel.relationships || [];
      
      console.log(`Processing data model with ${entities.length} entities and ${relationships.length} relationships`);
    }
    
    const fullPrompt = `
I need information about this data model:

ENTITIES:
${entities.map(e => `- ${e.name} (${e.type}): ${e.definition}
  Attributes: ${e.attributes.map(a => `${a.name} (${a.type}${a.isPrimaryKey ? ', PK' : ''}${a.isForeignKey ? ', FK' : ''})`).join(', ')}
`).join('\n')}

RELATIONSHIPS:
${relationships.map(r => {
  const sourceEntity = entities.find(e => e.id === r.sourceEntityId)?.name || r.sourceEntityId;
  const targetEntity = entities.find(e => e.id === r.targetEntityId)?.name || r.targetEntityId;
  return `- ${sourceEntity} to ${targetEntity}: ${r.name || 'Relationship'} (${r.sourceCardinality || '1'}:${r.targetCardinality || '1'}) - ${r.description || 'No description'}`;
}).join('\n')}

${documentsContext ? `
RELATED DOCUMENTS:
${documentsContext}
` : ''}

User question: ${message}

Please provide a thorough and accurate answer based on this information.
`;

    console.log("Sending request to OpenAI");
    console.log("Prompt length:", fullPrompt.length);
    console.log("First 100 chars of prompt:", fullPrompt.substring(0, 100) + "...");

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
            content: 'You are a data model expert who helps users understand their database schemas, entity relationships, and how to query data effectively. Provide accurate, detailed responses based on the information given about the data model and its entities and relationships.'
          },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.5
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
          headers: corsHeaders
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
          headers: corsHeaders
        }
      );
    }

    const aiResponse = data.choices[0].message.content;
    console.log("AI Response generated, length:", aiResponse.length);
    console.log("Response preview:", aiResponse.substring(0, 100) + "...");

    // Return the successful response
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Unexpected error in chat-with-data-model function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected server error' }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
});
