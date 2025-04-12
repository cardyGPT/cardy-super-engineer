
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
    const { message, dataModel, documentsContext, useAllProjects, projectsContext, projectTypesContext, selectedDocuments } = await req.json();

    if (!openAIApiKey) {
      console.error("OpenAI API key is missing");
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
      hasProjectsContext: Boolean(projectsContext),
      hasProjectTypesContext: Boolean(projectTypesContext),
      hasSelectedDocuments: Boolean(selectedDocuments),
      messageLength: message.length
    });

    // Prepare entities and relationships sections
    const entitiesSection = prepareEntitiesSection(normalizedDataModel.entities);
    const relationshipsSection = prepareRelationshipsSection(normalizedDataModel);

    // Prepare context sections for projects, project types, and selected documents
    const projectsSection = projectsContext ? `Selected Projects: ${projectsContext.join(", ")}` : "";
    const projectTypesSection = projectTypesContext ? `Selected Project Types: ${projectTypesContext.join(", ")}` : "";
    const selectedDocsSection = selectedDocuments ? `Selected Documents: ${selectedDocuments.join(", ")}` : "";

    // Enhanced system message to provide more comprehensive context and better directions
    const systemMessage = `You are an expert AI assistant called Cardy Mind. Your task is to answer questions about data models and project documentation with precision and clarity.

Data Model Overview:
- Total Entities: ${normalizedDataModel.entities.length}
- Total Relationships: ${normalizedDataModel.relationships.length}

${entitiesSection}

${relationshipsSection}

${documentsContext ? `\nProject Documentation Context:\n${documentsContext}` : ''}

${projectsSection ? `\n${projectsSection}` : ''}
${projectTypesSection ? `\n${projectTypesSection}` : ''}
${selectedDocsSection ? `\n${selectedDocsSection}` : ''}

GUIDELINES:
1. ALWAYS respond to questions directly and concisely
2. For data model questions, explain relationships between entities clearly
3. Never say you don't have access to the data model - you DO have it and MUST answer questions about it
4. If asked about project requirements or specifications, use the project documentation provided to you
5. For entity counts, relationship types, or other structural questions, provide specific numbers and details
6. Be helpful and informative even for simple questions
7. Use examples where appropriate to illustrate concepts
8. When project, type or document filters are selected, focus your answers on that specific context

IMPORTANT: Your purpose is to help users understand their data model and project documentation. Always assume you have the information required to answer questions about the provided data model or documents.`;

    console.log("Sending request to OpenAI with enhanced system message");
    
    // Call the OpenAI API with improved parameters
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
        temperature: 0.5, // Lower temperature for more focused responses
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
    console.log("OpenAI response received successfully");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response format from OpenAI:", data);
      return new Response(
        JSON.stringify({ error: "Invalid response format from OpenAI" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
            if (typeof rel === 'string') {
              const match = rel.match(/([^(]+)\s*\(([^)]+)\)/);
              if (match) {
                const targetName = match[1].trim();
                const cardinality = match[2];
                const [sourceCard, targetCard] = cardinality.split(':');
                
                dataModel.relationships.push({
                  id: `${entityId}_to_${targetName}`,
                  sourceEntityId: entityId,
                  targetEntityId: targetName.toLowerCase(),
                  name: `${entityId} to ${targetName}`,
                  description: '',
                  sourceCardinality: sourceCard || '1',
                  targetCardinality: targetCard || '1'
                });
              }
            }
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
  
  // Get entity types for source and target to highlight cross-type relationships
  const sourceType = dataModel.entities.find(e => e.id === rel.sourceEntityId)?.type || 'entity';
  const targetType = dataModel.entities.find(e => e.id === rel.targetEntityId)?.type || 'entity';
  
  return `Relationship: ${sourceEntity} (${sourceType}) to ${targetEntity} (${targetType})
  Cardinality: ${rel.sourceCardinality || '1'}:${rel.targetCardinality || '1'}
  Description: ${rel.description || 'No additional description'}`
}).join('\n\n')}`;
}
