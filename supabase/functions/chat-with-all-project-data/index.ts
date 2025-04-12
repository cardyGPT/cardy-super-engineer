
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create a Supabase client with the service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate necessary environment variables
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are not configured');
    }

    // Parse request data
    const { messages, documents } = await req.json();
    
    console.log(`Chat request received with ${messages?.length || 0} messages and ${documents?.length || 0} documents`);
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Valid messages array is required');
    }

    // Get the user's latest message
    const userMessage = messages[messages.length - 1].content;
    
    // Get project IDs from the provided documents
    const projectIds = documents && documents.length > 0 
      ? [...new Set(documents.map(doc => doc.projectId))]
      : [];
      
    console.log(`Found ${projectIds.length} unique project IDs in the documents`);

    // Retrieve relevant document chunks based on the user's query
    const relevantChunks = await getRelevantChunks(userMessage, projectIds);
    console.log(`Retrieved ${relevantChunks.length} relevant document chunks`);

    // Build the context from the relevant chunks
    const context = relevantChunks.map(chunk => 
      `Document: ${chunk.document_name || 'Unknown'} (${chunk.document_type || 'Unknown'})\n${chunk.chunk_text}`
    ).join('\n\n---\n\n');

    // Prepare the messages for the OpenAI API
    const systemPrompt = `You are Cardy Mind, an AI assistant that helps users understand and work with their project documents.
    Your goal is to provide accurate, helpful responses based on the document context provided.
    
    When responding:
    - Be concise but thorough
    - Focus on the facts present in the documents
    - Cite specific sections of documents when relevant
    - Admit when you don't know something or when the information isn't in the provided documents
    - Don't make up information that isn't present in the documents
    
    Remember, you are a professional assistant helping users understand their project documentation.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
    ];
    
    // Add context from relevant document chunks if available
    if (context) {
      apiMessages.push({ 
        role: "system", 
        content: `Here are the most relevant sections from the project documents:\n\n${context}`
      });
    }
    
    // Add the conversation history, but limit to last few messages to save tokens
    const conversationHistory = messages.slice(-5);
    apiMessages.push(...conversationHistory);

    console.log(`Sending ${apiMessages.length} messages to OpenAI`);

    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`Error from OpenAI API: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    console.log("Response received from OpenAI:", {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens,
    });

    return new Response(
      JSON.stringify({
        response: data.choices[0].message,
        usage: data.usage,
        context: {
          chunkCount: relevantChunks.length,
          projects: projectIds
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error in chat-with-all-project-data function: ${error.message}`);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while processing your request'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Function to get embedding for the query
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.replace(/\n/g, ' ').trim(),
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(`OpenAI API error: ${errorResponse.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error(`Error getting embedding: ${error.message}`);
    throw error;
  }
}

// Function to get relevant document chunks based on the query
async function getRelevantChunks(query: string, projectIds: string[], limit: number = 10): Promise<any[]> {
  try {
    // Get the embedding for the query
    const queryEmbedding = await getEmbedding(query);
    
    // Query the database for similar chunks
    let rpcQuery: any = {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: limit
    };
    
    // If project IDs are provided, add them to the query
    if (projectIds && projectIds.length > 0) {
      rpcQuery.filter = { project_id: projectIds };
    }
    
    // Use a SQL query with vector similarity search
    const { data: chunks, error } = await supabase.rpc('match_documents', rpcQuery);
    
    if (error) {
      console.error("Error in match_documents RPC:", error.message);
      
      // Fallback to a direct query if the RPC fails
      let query = supabase
        .from('project_chunks')
        .select(`
          id,
          project_id,
          document_id,
          document_type,
          chunk_text,
          chunk_index,
          documents(name)
        `)
        .limit(limit);
        
      if (projectIds && projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      }
      
      const { data: fallbackChunks, error: fallbackError } = await query;
      
      if (fallbackError) {
        throw new Error(`Error fetching chunks: ${fallbackError.message}`);
      }
      
      console.log(`Fallback query returned ${fallbackChunks?.length || 0} chunks`);
      
      // Format the results to match the expected structure
      return (fallbackChunks || []).map(chunk => ({
        ...chunk,
        document_name: chunk.documents?.name || 'Unknown document'
      }));
    }
    
    return chunks || [];
    
  } catch (error) {
    console.error(`Error in getRelevantChunks: ${error.message}`);
    return [];
  }
}
