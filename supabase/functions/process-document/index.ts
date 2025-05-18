
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

// Function to create chunks from text
function createChunks(text: string, maxChunkSize = 1000): string[] {
  // Split by paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph makes the chunk too big, start a new chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    
    // Add paragraph to current chunk
    if (currentChunk.length > 0) {
      currentChunk += "\n\n";
    }
    currentChunk += paragraph;
  }
  
  // Add the last chunk if not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Function to get embeddings for a text chunk
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

// Process a document
async function processDocument(documentId: string) {
  try {
    // Log processing start
    const startTime = performance.now();
    await supabase.from("document_processing_logs").insert({
      document_id: documentId,
      event_type: "process_start",
      status: "processing",
      message: "Document processing started",
    });
    
    // Update document status
    await supabase
      .from("document_metadata")
      .update({ status: "processing" })
      .eq("id", documentId);
    
    // Get document metadata
    const { data: document, error: docError } = await supabase
      .from("document_metadata")
      .select("*")
      .eq("id", documentId)
      .single();
    
    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || "Unknown error"}`);
    }
    
    // For now, we'll assume the content is available at the source_url
    // In a real system, you'd fetch and parse according to file_type
    let documentText = "";
    
    // For demonstration, let's assume a simple text file accessible via URL
    // In real system, this would include PDF extraction, CSV parsing, etc.
    if (document.source_url) {
      try {
        const response = await fetch(document.source_url);
        documentText = await response.text();
      } catch (fetchError) {
        throw new Error(`Error fetching document: ${fetchError.message}`);
      }
    } else {
      documentText = `Sample content for ${document.title}. This is placeholder text for demonstration.`;
    }
    
    // Create chunks
    const chunks = createChunks(documentText);
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Get embedding for chunk
      const embedding = await getEmbedding(chunk);
      
      // Store chunk and embedding
      await supabase.from("document_content").insert({
        document_id: documentId,
        chunk_index: i,
        chunk_text: chunk,
        embedding,
      });
    }
    
    // Update document status
    const endTime = performance.now();
    const processingTime = (endTime - startTime) / 1000; // Convert to seconds
    
    await supabase
      .from("document_metadata")
      .update({ 
        status: "completed",
        last_processed_date: new Date().toISOString()
      })
      .eq("id", documentId);
    
    // Log processing completion
    await supabase.from("document_processing_logs").insert({
      document_id: documentId,
      event_type: "process_complete",
      status: "completed",
      message: `Processed ${chunks.length} chunks`,
      processing_time: processingTime,
    });
    
    return {
      success: true,
      chunks: chunks.length,
      processingTime,
    };
  } catch (error) {
    // Log processing error
    await supabase.from("document_processing_logs").insert({
      document_id: documentId,
      event_type: "process_error",
      status: "failed",
      message: error.message,
    });
    
    // Update document status
    await supabase
      .from("document_metadata")
      .update({ status: "failed" })
      .eq("id", documentId);
    
    return {
      success: false,
      error: error.message,
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get request body
    const { documentId } = await req.json();
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "Document ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Process document
    const result = await processDocument(documentId);
    
    return new Response(
      JSON.stringify(result),
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
