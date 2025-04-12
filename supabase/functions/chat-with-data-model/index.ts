
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, message, dataModel, documentsContext } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a system message with data model information to provide context
    const systemMessage = `You are a data modeling expert assistant. Your task is to help understand and explain the following data model:

Data Model Entities:
${dataModel.entities.map(entity => 
  `- ${entity.name} (${entity.type}): ${entity.definition}
  Attributes: ${entity.attributes.map(attr => 
    `${attr.name} (${attr.type}${attr.required ? ', required' : ''}${attr.isPrimaryKey ? ', PK' : ''}${attr.isForeignKey ? ', FK' : ''})`
  ).join(', ')}`
).join('\n')}

Data Model Relationships:
${dataModel.relationships.map(rel => {
  const sourceEntity = dataModel.entities.find(e => e.id === rel.sourceEntityId)?.name || rel.sourceEntityId;
  const targetEntity = dataModel.entities.find(e => e.id === rel.targetEntityId)?.name || rel.targetEntityId;
  return `- ${rel.name || `Relationship ${rel.id}`}: ${sourceEntity} to ${targetEntity} (${rel.sourceCardinality || '1'}:${rel.targetCardinality || '1'})${rel.description ? ` - ${rel.description}` : ''}`;
}).join('\n')}

${documentsContext ? `\nAdditional Project Context:\n${documentsContext}` : ''}

Provide clear and concise answers to questions about this data model. You can explain relationships, suggest improvements, or clarify the purpose of entities and attributes. If asked about SQL or code generation, provide examples relevant to this data model.`;

    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: `Error from OpenAI API: ${errorData.error?.message || 'Unknown error'}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-with-data-model function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
