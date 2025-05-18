
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { corsHeaders } from "../_shared/cors.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const configuration = new Configuration({ apiKey: openaiApiKey });
const openai = new OpenAIApi(configuration);

// Function to get embeddings for a text
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data.data[0].embedding;
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw error;
  }
}

// Function to query documents by similarity
async function queryDocuments(query: string, projectId?: string, limit = 5) {
  try {
    // Create embedding for query
    const embedding = await getEmbedding(query);
    
    // Prepare filter
    const filter: any = {};
    if (projectId) {
      filter.project_id = projectId;
    }
    
    // Query for similar documents using the similarity function
    const { data: chunks, error } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit,
        filter: filter
      }
    );
    
    if (error) {
      throw new Error(`Error querying documents: ${error.message}`);
    }
    
    // Log the query for analytics
    await supabase.from("document_access").insert({
      document_id: chunks.length > 0 ? chunks[0].document_id : null,
      access_type: "query",
      query_text: query,
    });
    
    return chunks;
  } catch (error) {
    console.error("Error in queryDocuments:", error);
    throw error;
  }
}

// Function to generate response from LLM
async function generateResponse(query: string, contexts: string[]) {
  try {
    // Combine contexts into one text
    const combinedContext = contexts.join("\n\n");
    
    // Generate completion using context
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions based on the provided context. If the context doesn't contain relevant information, indicate that you don't have enough information to answer accurately."
        },
        {
          role: "user",
          content: `Context information is below.
---------------------
${combinedContext}
---------------------
Given the context information and not prior knowledge, answer the following question: ${query}`
        }
      ],
      temperature: 0.5,
      max_tokens: 500
    });
    
    return response.data.choices[0].message?.content || "No response generated";
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get request body
    const { query, projectId, generateAnswer = true } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Query documents
    const chunks = await queryDocuments(query, projectId);
    
    // Generate response if requested
    let answer = null;
    if (generateAnswer && chunks.length > 0) {
      const contexts = chunks.map(chunk => chunk.chunk_text);
      answer = await generateResponse(query, contexts);
    }
    
    return new Response(
      JSON.stringify({
        chunks,
        answer,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
