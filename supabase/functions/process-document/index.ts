
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
      .select('id, name, type, content, project_id, file_url, file_type')
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
      // For PDFs or other files, we need to download and process the content
      if (document.file_type && document.file_type.includes('pdf')) {
        console.log(`Processing PDF document: ${document.file_url}`);
        
        try {
          // Download the PDF file
          const response = await fetch(document.file_url);
          if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
          }
          
          // For PDF files, we'll use an OpenAI extraction approach
          // This is a workaround since Deno doesn't have PDF parsing libraries
          const fileBuffer = await response.arrayBuffer();
          const base64File = btoa(
            new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          console.log(`PDF downloaded, size: ${fileBuffer.byteLength} bytes`);
          
          // Use OpenAI to extract text from the PDF
          const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                  content: `You are a PDF extraction tool. Extract as much text as possible from the PDF file URL. 
                  The file name is "${document.name}" and seems to be about "${document.type}".
                  Extract meaningful content only - ignore page numbers, headers, and formatting.`
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `Extract the text content from this PDF file: ${document.name}`
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:application/pdf;base64,${base64File}`
                      }
                    }
                  ]
                }
              ],
              max_tokens: 4000  // Use a large token limit for PDF extraction
            }),
          });
          
          if (!extractResponse.ok) {
            const errorData = await extractResponse.json();
            throw new Error(`OpenAI extraction error: ${JSON.stringify(errorData)}`);
          }
          
          const extractData = await extractResponse.json();
          textContent = extractData.choices[0].message.content;
          
          console.log(`Successfully extracted text from PDF. Length: ${textContent.length} chars`);
          
          // Save the extracted content back to the document for future use
          const { error: updateError } = await supabase
            .from('documents')
            .update({ content: textContent })
            .eq('id', document.id);
          
          if (updateError) {
            console.error(`Warning: Failed to update document with extracted content: ${updateError.message}`);
          } else {
            console.log(`Updated document with extracted text content`);
          }
        } catch (pdfError) {
          console.error(`Error processing PDF: ${pdfError.message}`);
          textContent = `Document: ${document.name}\nType: ${document.type}\nError: Could not process PDF content.`;
        }
      } else {
        // For other file types, use a generic approach
        console.log(`Document has file_url: ${document.file_url}`);
        textContent = `Document: ${document.name}\nType: ${document.type}\nFile URL: ${document.file_url}`;
      }
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

    // Split content into chunks (improved approach with better overlap handling)
    const chunks = splitIntoChunks(textContent, 1500, 300);
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

// Improved function to split text into chunks with better overlap handling
function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    // Calculate the end index for this chunk
    let endIndex = Math.min(startIndex + chunkSize, text.length);

    // If we're not at the end of the text, try to find a good break point
    if (endIndex < text.length) {
      // Look for a good break point (sentence or paragraph)
      const breakPoints = ['. ', '! ', '? ', '\n\n', '\n', ';', ',', ' '];
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
    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move the start index for the next chunk, accounting for overlap
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
    
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
