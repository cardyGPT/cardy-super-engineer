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
      if (typeof document.content === 'object') {
        try {
          textContent = JSON.stringify(document.content, null, 2);
          console.log(`Successfully converted JSON object to string, length: ${textContent.length}`);
        } catch (e) {
          console.error(`Error stringifying JSON content: ${e.message}`);
          textContent = `Document: ${document.name}\nType: ${document.type}\nError: Could not process JSON content.`;
        }
      } else if (typeof document.content === 'string') {
        textContent = document.content;
        console.log(`Using string content, length: ${textContent.length}`);
      } else {
        console.warn(`Unknown content type: ${typeof document.content}`);
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
                  Extract meaningful content only - ignore page numbers, headers, and formatting.
                  Preserve the document structure as much as possible, including section headings and hierarchical organization.`
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
      } else if (document.file_type && document.file_type.includes('json')) {
        // Handle JSON files
        try {
          const response = await fetch(document.file_url);
          if (!response.ok) {
            throw new Error(`Failed to download JSON file: ${response.statusText}`);
          }
          
          const jsonContent = await response.json();
          textContent = JSON.stringify(jsonContent, null, 2);
          
          console.log(`Successfully downloaded and parsed JSON file, length: ${textContent.length}`);
          
          // Save the extracted content back to the document
          const { error: updateError } = await supabase
            .from('documents')
            .update({ content: jsonContent })
            .eq('id', document.id);
          
          if (updateError) {
            console.error(`Warning: Failed to update document with JSON content: ${updateError.message}`);
          } else {
            console.log(`Updated document with parsed JSON content`);
          }
        } catch (jsonError) {
          console.error(`Error processing JSON file: ${jsonError.message}`);
          textContent = `Document: ${document.name}\nType: ${document.type}\nError: Could not process JSON file.`;
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

    // Split content into chunks using semantic chunking
    const chunks = splitIntoSemanticChunks(textContent, document.type);
    console.log(`Split document into ${chunks.length} semantically meaningful chunks`);

    // Process each chunk and get embeddings
    const embeddingPromises = chunks.map(async (chunk, index) => {
      try {
        const embedding = await getEmbedding(chunk.text);
        
        // Insert chunk and embedding into the database
        const { error: insertError } = await supabase
          .from('project_chunks')
          .insert({
            project_id: document.project_id,
            document_id: document.id,
            document_type: document.type,
            chunk_text: chunk.text,
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

// Function to split text into semantically meaningful chunks
function splitIntoSemanticChunks(text: string, documentType: string): { text: string }[] {
  const chunks: { text: string }[] = [];
  const maxChunkSize = 1500;
  
  // For JSON documents, use special handling
  if (documentType === 'data-model' || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      // Try to parse if it's a JSON string
      let jsonObj;
      if (typeof text === 'string') {
        try {
          jsonObj = JSON.parse(text);
        } catch (e) {
          // If it's not valid JSON but is a data model, chunk by lines
          return splitTextByLineGroups(text, maxChunkSize);
        }
      } else {
        jsonObj = text;
      }
      
      // Convert back to string with formatting
      const formattedJson = JSON.stringify(jsonObj, null, 2);
      
      // For small JSON documents, keep them together
      if (formattedJson.length <= maxChunkSize * 1.5) {
        chunks.push({ text: formattedJson });
        return chunks;
      }
      
      // For larger JSON documents, try to split by top-level keys
      if (typeof jsonObj === 'object' && jsonObj !== null) {
        if (Array.isArray(jsonObj)) {
          // For arrays, chunk by items
          let currentChunk = '';
          for (const item of jsonObj) {
            const itemStr = JSON.stringify(item, null, 2);
            
            if (currentChunk.length + itemStr.length > maxChunkSize && currentChunk.length > 0) {
              chunks.push({ text: `[${currentChunk}]` });
              currentChunk = '';
            }
            
            if (currentChunk.length > 0) {
              currentChunk += ',\n';
            }
            
            currentChunk += itemStr;
          }
          
          if (currentChunk.length > 0) {
            chunks.push({ text: `[${currentChunk}]` });
          }
        } else {
          // For objects, chunk by keys
          const keys = Object.keys(jsonObj);
          let currentChunk = '';
          let currentChunkKeys = [];
          
          for (const key of keys) {
            const keyValue = jsonObj[key];
            const keyValueStr = JSON.stringify({ [key]: keyValue }, null, 2).slice(1, -1);
            
            if (currentChunk.length + keyValueStr.length > maxChunkSize && currentChunk.length > 0) {
              chunks.push({ text: `{\n${currentChunk}\n}` });
              currentChunk = '';
              currentChunkKeys = [];
            }
            
            if (currentChunk.length > 0) {
              currentChunk += ',\n';
            }
            
            currentChunk += keyValueStr;
            currentChunkKeys.push(key);
          }
          
          if (currentChunk.length > 0) {
            chunks.push({ text: `{\n${currentChunk}\n}` });
          }
        }
      } else {
        // Fallback to line-by-line chunking
        return splitTextByLineGroups(formattedJson, maxChunkSize);
      }
    } catch (e) {
      console.error("Error processing JSON document:", e);
      return splitTextByLineGroups(text, maxChunkSize);
    }
  } else {
    // For text documents, use semantic splitting
    return splitTextBySemanticStructure(text, maxChunkSize);
  }
  
  return chunks;
}

// Split text by natural semantic boundaries
function splitTextBySemanticStructure(text: string, maxChunkSize: number): { text: string }[] {
  const chunks: { text: string }[] = [];
  const sections = text.split(/(?=#{1,6}\s|SECTION\s+\d+:|CHAPTER\s+\d+:|\n\n|\r\n\r\n)/gi);
  
  let currentChunk = "";
  
  for (const section of sections) {
    // If adding this section exceeds the chunk size and we already have content,
    // save the current chunk and start a new one
    if (currentChunk.length + section.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({ text: currentChunk.trim() });
      currentChunk = "";
    }
    
    // If the section itself is larger than the max size, we need to split it further
    if (section.length > maxChunkSize) {
      // If we have content in the current chunk, save it first
      if (currentChunk.length > 0) {
        chunks.push({ text: currentChunk.trim() });
        currentChunk = "";
      }
      
      // Split the large section by paragraphs
      const paragraphs = section.split(/\n\n|\r\n\r\n/);
      let paragraphChunk = "";
      
      for (const paragraph of paragraphs) {
        if (paragraphChunk.length + paragraph.length > maxChunkSize && paragraphChunk.length > 0) {
          chunks.push({ text: paragraphChunk.trim() });
          paragraphChunk = "";
        }
        
        // If a single paragraph is too large, split by sentences
        if (paragraph.length > maxChunkSize) {
          if (paragraphChunk.length > 0) {
            chunks.push({ text: paragraphChunk.trim() });
            paragraphChunk = "";
          }
          
          // Split by sentences (simple approximation)
          const sentences = paragraph.split(/(?<=[.!?])\s+/);
          let sentenceChunk = "";
          
          for (const sentence of sentences) {
            if (sentenceChunk.length + sentence.length > maxChunkSize && sentenceChunk.length > 0) {
              chunks.push({ text: sentenceChunk.trim() });
              sentenceChunk = "";
            }
            
            // If a single sentence is still too long, just split by size
            if (sentence.length > maxChunkSize) {
              if (sentenceChunk.length > 0) {
                chunks.push({ text: sentenceChunk.trim() });
                sentenceChunk = "";
              }
              
              // Split the sentence into smaller parts
              for (let i = 0; i < sentence.length; i += maxChunkSize) {
                const part = sentence.substring(i, Math.min(i + maxChunkSize, sentence.length));
                chunks.push({ text: part.trim() });
              }
            } else {
              sentenceChunk += sentenceChunk.length > 0 ? " " + sentence : sentence;
            }
          }
          
          if (sentenceChunk.length > 0) {
            chunks.push({ text: sentenceChunk.trim() });
          }
        } else {
          paragraphChunk += paragraphChunk.length > 0 ? "\n\n" + paragraph : paragraph;
        }
      }
      
      if (paragraphChunk.length > 0) {
        chunks.push({ text: paragraphChunk.trim() });
      }
    } else {
      currentChunk += currentChunk.length > 0 ? "\n\n" + section : section;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push({ text: currentChunk.trim() });
  }
  
  return chunks;
}

// Split text by line groups with overlap
function splitTextByLineGroups(text: string, maxChunkSize: number): { text: string }[] {
  const chunks: { text: string }[] = [];
  const lines = text.split(/\r?\n/);
  let currentChunk = "";
  
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push({ text: currentChunk });
      
      // Create overlap by taking the last few lines of the previous chunk
      const overlapLines = currentChunk.split(/\r?\n/).slice(-3);
      currentChunk = overlapLines.join("\n");
    }
    
    currentChunk += currentChunk.length > 0 ? "\n" + line : line;
  }
  
  if (currentChunk.length > 0) {
    chunks.push({ text: currentChunk });
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
