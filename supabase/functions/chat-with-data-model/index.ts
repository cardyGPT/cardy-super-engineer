
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, dataModel, documentsContext, useAllProjects } = await req.json();

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured in environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing request with model data:", {
      modelEntityCount: dataModel.entities.length,
      modelRelationshipCount: dataModel.relationships.length,
      hasDocumentsContext: Boolean(documentsContext),
      useAllProjects: Boolean(useAllProjects),
      message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
    });

    // Enhance system message to provide more comprehensive context
    const systemMessage = `You are an expert AI data modeling assistant. Your task is to provide detailed, insightful answers about the following data model while maintaining context from any additional project documents.

Data Model Overview:
- Total Entities: ${dataModel.entities.length}
- Total Relationships: ${dataModel.relationships.length}

Detailed Data Model Entities:
${dataModel.entities.map(entity => 
  `Entity: ${entity.name} (${entity.type})
  Definition: ${entity.definition}
  Attributes: ${entity.attributes.map(attr => 
    `${attr.name} (${attr.type}${attr.required ? ', required' : ''}${attr.isPrimaryKey ? ', Primary Key' : ''}${attr.isForeignKey ? ', Foreign Key' : ''})`
  ).join(', ')}`
).join('\n\n')}

Data Model Relationships:
${dataModel.relationships.map(rel => {
  const sourceEntity = dataModel.entities.find(e => e.id === rel.sourceEntityId)?.name || rel.sourceEntityId;
  const targetEntity = dataModel.entities.find(e => e.id === rel.targetEntityId)?.name || rel.targetEntityId;
  return `Relationship: ${sourceEntity} to ${targetEntity}
  Cardinality: ${rel.sourceCardinality || '1'}:${rel.targetCardinality || '1'}
  Description: ${rel.description || 'No additional description'}`
}).join('\n\n')}

${documentsContext ? `\nAdditional Project Context:\n${documentsContext}` : ''}

You should:
1. Explain data model structure clearly
2. Provide insights about relationships
3. Suggest potential improvements or optimizations
4. Answer questions about the data model comprehensively
5. If you don't know the answer, simply say so rather than making up information`;

    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    console.log("Successfully generated response");
    
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
