
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

    // Normalize the data model structure if needed
    const normalizedDataModel = normalizeDataModel(dataModel);
    
    console.log("Processing request with model data:", {
      modelEntityCount: normalizedDataModel.entities.length,
      modelRelationshipCount: normalizedDataModel.relationships.length,
      hasDocumentsContext: Boolean(documentsContext),
      useAllProjects: Boolean(useAllProjects),
      message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
    });

    // Prepare entities and relationships sections
    const entitiesSection = prepareEntitiesSection(normalizedDataModel.entities);
    const relationshipsSection = prepareRelationshipsSection(normalizedDataModel);

    // Enhance system message to provide more comprehensive context
    const systemMessage = `You are an expert AI data modeling assistant. Your task is to provide detailed, insightful answers about the following data model while maintaining context from any additional project documents.

Data Model Overview:
- Total Entities: ${normalizedDataModel.entities.length}
- Total Relationships: ${normalizedDataModel.relationships.length}

${entitiesSection}

${relationshipsSection}

${documentsContext ? `\nAdditional Project Context:\n${documentsContext}` : ''}

You should:
1. Explain data model structure clearly
2. Provide insights about relationships
3. Suggest potential improvements or optimizations
4. Answer questions about the data model comprehensively
5. If the question is about project requirements or documents that have been shared with you, answer based on that context
6. If you don't know the answer, simply say so rather than making up information`;

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

// Helper function to normalize data model structure
function normalizeDataModel(dataModel) {
  try {
    // If the dataModel is already in the correct format, return it
    if (dataModel.entities && Array.isArray(dataModel.entities) && 
        dataModel.relationships && Array.isArray(dataModel.relationships)) {
      return dataModel;
    }
    
    // Handle the format shown in the screenshot (entities as an object)
    if (dataModel.entities && typeof dataModel.entities === 'object' && !Array.isArray(dataModel.entities)) {
      const entitiesArray = [];
      
      // Convert object-based entities to array format
      for (const [entityId, entityData] of Object.entries(dataModel.entities)) {
        const entity = {
          id: entityId,
          name: entityData.name || entityId,
          definition: entityData.definition || '',
          type: entityData.type || 'entity',
          attributes: []
        };
        
        // Handle columns/attributes conversion
        if (entityData.columns && Array.isArray(entityData.columns)) {
          entity.attributes = entityData.columns.map(column => {
            const isPrimaryKey = column.includes('(PK)');
            const isForeignKey = column.includes('(FK)');
            const name = column.replace(/\s*\([PF]K\)\s*/g, '').trim();
            
            return {
              name,
              type: 'string',
              required: isPrimaryKey,
              isPrimaryKey,
              isForeignKey,
              description: ''
            };
          });
        }
        
        // Handle relationships if present at the entity level
        if (entityData.relationships && Array.isArray(entityData.relationships)) {
          if (!dataModel.relationships) {
            dataModel.relationships = [];
          }
          
          entityData.relationships.forEach(rel => {
            const [targetName, cardinality] = rel.split(/\s+\(([^)]+)\)/);
            const relationship = {
              id: `${entityId}_to_${targetName}`,
              sourceEntityId: entityId,
              targetEntityId: targetName.trim().toLowerCase(),
              name: `${entityId} to ${targetName}`,
              description: '',
              sourceCardinality: cardinality ? cardinality.split(':')[0] : '1',
              targetCardinality: cardinality ? cardinality.split(':')[1] : '1'
            };
            
            dataModel.relationships.push(relationship);
          });
        }
        
        entitiesArray.push(entity);
      }
      
      return {
        entities: entitiesArray,
        relationships: dataModel.relationships || []
      };
    }
    
    // If we can't normalize it, return a simple structure
    return dataModel;
  } catch (e) {
    console.error("Error normalizing data model:", e);
    // Return the original data model if normalization fails
    return dataModel;
  }
}

// Helper function to prepare entities section for the system message
function prepareEntitiesSection(entities) {
  if (!entities || entities.length === 0) {
    return "No entities defined in the data model.";
  }
  
  return `Detailed Data Model Entities:
${entities.map(entity => 
  `Entity: ${entity.name} (${entity.type || 'entity'})
  Definition: ${entity.definition || 'No definition provided'}
  Attributes: ${(entity.attributes || []).map(attr => 
    `${attr.name} (${attr.type || 'string'}${attr.required ? ', required' : ''}${attr.isPrimaryKey ? ', Primary Key' : ''}${attr.isForeignKey ? ', Foreign Key' : ''})`
  ).join(', ')}`
).join('\n\n')}`;
}

// Helper function to prepare relationships section for the system message
function prepareRelationshipsSection(dataModel) {
  if (!dataModel.relationships || dataModel.relationships.length === 0) {
    return "No relationships defined in the data model.";
  }
  
  return `Data Model Relationships:
${dataModel.relationships.map(rel => {
  const sourceEntity = dataModel.entities.find(e => e.id === rel.sourceEntityId)?.name || rel.sourceEntityId;
  const targetEntity = dataModel.entities.find(e => e.id === rel.targetEntityId)?.name || rel.targetEntityId;
  return `Relationship: ${sourceEntity} to ${targetEntity}
  Cardinality: ${rel.sourceCardinality || '1'}:${rel.targetCardinality || '1'}
  Description: ${rel.description || 'No additional description'}`
}).join('\n\n')}`;
}
