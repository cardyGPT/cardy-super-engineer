
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, documentIds = [] } = await req.json();
    
    console.log("Chat with documents request received:", {
      messageLength: message?.length || 0,
      projectId,
      documentIds: documentIds.length
    });
    
    if (!message) {
      throw new Error('No message provided');
    }
    
    // Create Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate embedding for the query
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: message.replace(/\n/g, ' ')
      }),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.json();
      throw new Error(`Error generating embeddings: ${error.error?.message || error.message || 'Unknown error'}`);
    }

    const { data: embeddingData } = await embeddingResponse.json();
    const embedding = embeddingData[0].embedding;
    
    console.log("Generated embedding for query");
    
    // Set up filter for the similarity search
    const filter: Record<string, any> = {};
    if (projectId) {
      filter.project_id = projectId;
    }
    
    // Use vector similarity search function to find relevant document chunks
    const { data: relevantChunks, error: searchError } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: embedding,
        match_threshold: 0.5,  // Threshold for similarity
        match_count: 10,       // Number of matches to return
        filter: filter
      }
    );
    
    if (searchError) {
      console.error("Error in similarity search:", searchError);
      throw new Error(`Error retrieving relevant document chunks: ${searchError.message}`);
    }
    
    console.log(`Retrieved ${relevantChunks?.length || 0} relevant document chunks`);
    
    // Filter by specific documents if provided
    let filteredChunks = relevantChunks;
    if (documentIds.length > 0) {
      filteredChunks = relevantChunks.filter(chunk => 
        documentIds.includes(chunk.document_id)
      );
      console.log(`Filtered to ${filteredChunks.length} chunks from selected documents`);
    }
    
    // Build context from the relevant chunks
    let documentsContext = '';
    if (filteredChunks && filteredChunks.length > 0) {
      // Group chunks by document for better context
      const documentGroups = filteredChunks.reduce((groups, chunk) => {
        const docName = chunk.document_name;
        if (!groups[docName]) {
          groups[docName] = [];
        }
        groups[docName].push(chunk);
        return groups;
      }, {});
      
      // Format each document's chunks
      for (const [docName, chunks] of Object.entries(documentGroups)) {
        documentsContext += `--- Document: ${docName} ---\n\n`;
        // Sort chunks by their original order in the document
        const sortedChunks = chunks.sort((a, b) => a.chunk_index - b.chunk_index);
        
        for (const chunk of sortedChunks) {
          documentsContext += `${chunk.chunk_text}\n\n`;
        }
        documentsContext += '---\n\n';
      }
    }
    
    const systemPrompt = `You are Cardy Mind, an AI assistant that helps users understand their project documents.
    Your goal is to provide accurate, helpful responses based on the document context provided.
    
    When responding:
    - Be concise but thorough
    - Focus on the facts present in the documents
    - Cite specific sections of documents when relevant
    - Admit when you don't know something or when the information isn't in the provided documents
    - Don't make up information that isn't present in the documents
    
    Remember, you are a professional assistant helping users understand their project documentation.`;

    // Create messages array with system prompt, document context, and user message
    const messages = [
      { role: "system", content: systemPrompt },
    ];
    
    // Add documents context if available
    if (documentsContext) {
      messages.push({ 
        role: "system", 
        content: `Here are the relevant project documents to reference:\n\n${documentsContext}` 
      });
    }
    
    // Add user message
    messages.push({ role: "user", content: message });

    console.log("Sending request to OpenAI with context size:", JSON.stringify(messages).length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.3,
        max_tokens: 1500,
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

    return new Response(JSON.stringify({
      response: data.choices[0].message.content,
      usage: data.usage,
      contextSize: documentsContext.length,
      relevantDocuments: filteredChunks ? filteredChunks.map(chunk => ({
        documentName: chunk.document_name,
        similarity: chunk.similarity
      })) : []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-documents function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while processing your request',
      stack: error.stack,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
