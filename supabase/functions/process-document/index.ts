
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
    const { documentId } = await req.json();
    console.log(`Processing document: ${documentId}`);

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    // Fetch the document data
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, name, type, content, project_id, file_url')
      .eq('id', documentId)
      .single();

    if (documentError || !document) {
      throw new Error(`Error fetching document: ${documentError?.message || 'Document not found'}`);
    }

    console.log(`Retrieved document: ${document.name} (${document.type})`);

    // Get document content based on type
    let textContent = '';
    
    if (document.content) {
      // Handle JSON content (like data models)
      if (document.type === 'data-model') {
        textContent = JSON.stringify(document.content, null, 2);
      } else if (typeof document.content === 'string') {
        textContent = document.content;
      } else {
        textContent = JSON.stringify(document.content);
      }
    } else if (document.file_url) {
      // For PDFs, we would need PDF extraction here
      // This is a simplified version - in production you'd need proper PDF parsing
      console.log(`Document has file_url: ${document.file_url}`);
      // For now, we'll just use the document name and type as placeholder content
      textContent = `Document: ${document.name}\nType: ${document.type}`;
    }

    if (!textContent.trim()) {
      throw new Error('No content to process in this document');
    }

    // Delete any existing chunks for this document to avoid duplicates
    const { error: deleteError } = await supabase
      .from('project_chunks')
      .delete()
      .eq('document_id', document.id);

    if (deleteError) {
      console.error(`Warning: Failed to delete existing chunks: ${deleteError.message}`);
    }

    // Split content into chunks (simple approach, can be improved)
    const chunks = splitIntoChunks(textContent, 1000, 200);
    console.log(`Split document into ${chunks.length} chunks`);

    // Process each chunk and get embeddings
    const embeddingPromises = chunks.map(async (chunk, index) => {
      try {
        const embedding = await getEmbedding(chunk);
        
        // Insert chunk and embedding into the database
        const { error: insertError } = await supabase
          .from('project_chunks')
          .insert({
            project_id: document.project_id,
            document_id: document.id,
            document_type: document.type,
            chunk_text: chunk,
            chunk_index: index,
            embedding: embedding
          });

        if (insertError) {
          console.error(`Error inserting chunk ${index}: ${insertError.message}`);
          return { success: false, error: insertError.message };
        }

        return { success: true, index };
      } catch (error) {
        console.error(`Error processing chunk ${index}: ${error.message}`);
        return { success: false, error: error.message, index };
      }
    });

    // Wait for all chunks to be processed
    const results = await Promise.all(embeddingPromises);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully processed ${successCount} of ${chunks.length} chunks`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Document processed: ${successCount} chunks created`,
        documentId: document.id,
        totalChunks: chunks.length,
        successfulChunks: successCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error in process-document function: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to split text into chunks with overlap
function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    // Calculate the end index for this chunk
    let endIndex = Math.min(startIndex + chunkSize, text.length);

    // If we're not at the end of the text, try to find a good break point
    if (endIndex < text.length) {
      // Look for a good break point (sentence or paragraph)
      const breakPoints = ['. ', '! ', '? ', '\n\n', '\n', ' '];
      let breakFound = false;

      for (const breakPoint of breakPoints) {
        const breakIndex = text.lastIndexOf(breakPoint, endIndex);
        if (breakIndex > startIndex && breakIndex < endIndex) {
          endIndex = breakIndex + breakPoint.length;
          breakFound = true;
          break;
        }
      }

      // If no good break point, just use space to avoid cutting words
      if (!breakFound) {
        const lastSpace = text.lastIndexOf(' ', endIndex);
        if (lastSpace > startIndex) {
          endIndex = lastSpace + 1;
        }
      }
    }

    // Add the chunk
    chunks.push(text.substring(startIndex, endIndex).trim());

    // Move the start index for the next chunk, accounting for overlap
    startIndex = endIndex - overlap;
    
    // Ensure we're making progress and not stuck in a loop
    if (startIndex <= 0 || startIndex >= text.length - 1) {
      break;
    }
  }

  return chunks;
}

// Function to get embeddings from OpenAI API
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
