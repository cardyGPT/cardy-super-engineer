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
    const { documentId, fileUrl, fileType, projectId, forceReprocess = false } = await req.json();
    console.log(`Processing document: ${documentId}, Force reprocess: ${forceReprocess}`);

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
          const fileBuffer = await response.arrayBuffer();
          const base64File = btoa(
            new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          console.log(`PDF downloaded, size: ${fileBuffer.byteLength} bytes`);
          
          // Use OpenAI to extract text from the PDF - multiple extraction calls for large PDFs
          // This improves the handling of large documents by extracting text in sections
          const maxTokenCount = 4000;
          let fullContent = '';
          
          // First, get a rough overview of the document structure to better guide extraction
          console.log("Initial document analysis...");
          const structureResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                  content: `You are a document structure analyzer. Quickly scan the PDF document and identify:
                  1. How many pages it approximately has
                  2. The main sections or chapters 
                  3. Whether it contains tables, diagrams, or code blocks
                  Don't extract the full content yet - just provide a brief structural overview.`
                },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: `Analyze the structure of this PDF: ${document.name}` },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:application/pdf;base64,${base64File}`
                      }
                    }
                  ]
                }
              ],
              max_tokens: 1000
            }),
          });
          
          if (!structureResponse.ok) {
            const errorData = await structureResponse.json();
            console.error(`OpenAI structure analysis error: ${JSON.stringify(errorData)}`);
          } else {
            const structureData = await structureResponse.json();
            const structureOverview = structureData.choices[0].message.content;
            console.log(`Document structure overview: ${structureOverview.substring(0, 200)}...`);
            
            // Append the structure overview to the beginning of our content
            fullContent += "# DOCUMENT STRUCTURE OVERVIEW\n\n";
            fullContent += structureOverview;
            fullContent += "\n\n# FULL DOCUMENT CONTENT\n\n";
          }
          
          // Now extract the content in sections - using multiple API calls for large documents
          // We'll make a request to extract the beginning, middle, and end separately
          const extractionPrompts = [
            "Extract the text from the beginning sections of this document, focusing on introduction, executive summary, and the first few chapters or sections.",
            "Extract the text from the middle sections of this document, focusing on the main body of content.",
            "Extract the text from the final sections of this document, focusing on conclusions, appendices, and any references."
          ];
          
          for (const prompt of extractionPrompts) {
            console.log(`Extracting text with prompt: ${prompt.substring(0, 40)}...`);
            
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
                    content: `You are a PDF extraction tool. Extract text from the section of the PDF specified in the user's request.
                    The file name is "${document.name}" and seems to be about "${document.type}".
                    Extract meaningful content only - ignore page numbers, headers, and formatting.
                    Preserve the document structure as much as possible, including section headings and hierarchical organization.
                    Format any tables as markdown tables.
                    Format any code blocks with appropriate markdown syntax.`
                  },
                  {
                    role: 'user',
                    content: [
                      { type: 'text', text: prompt },
                      {
                        type: 'image_url',
                        image_url: {
                          url: `data:application/pdf;base64,${base64File}`
                        }
                      }
                    ]
                  }
                ],
                max_tokens: maxTokenCount
              }),
            });
            
            if (!extractResponse.ok) {
              const errorData = await extractResponse.json();
              console.error(`OpenAI extraction error: ${JSON.stringify(errorData)}`);
              continue;
            }
            
            const extractData = await extractResponse.json();
            const sectionContent = extractData.choices[0].message.content;
            
            // Add section content to our full content
            fullContent += sectionContent + "\n\n";
            console.log(`Added ${sectionContent.length} chars of extracted content from section`);
          }
          
          textContent = fullContent;
          console.log(`Successfully extracted text from PDF. Total length: ${textContent.length} chars`);
          
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
    if (forceReprocess) {
      console.log(`Force reprocessing requested. Deleting existing chunks for document ${document.id}`);
      const { error: deleteError } = await supabase
        .from('project_chunks')
        .delete()
        .eq('document_id', document.id);

      if (deleteError) {
        console.error(`Warning: Failed to delete existing chunks: ${deleteError.message}`);
      }
    } else {
      // Check if chunks already exist
      const { data: existingChunks, error: checkError } = await supabase
        .from('project_chunks')
        .select('id')
        .eq('document_id', document.id)
        .limit(1);
      
      if (!checkError && existingChunks && existingChunks.length > 0) {
        console.log(`Chunks already exist for document ${document.id}. Skipping processing.`);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Document already processed. Use forceReprocess=true to reprocess.`,
            documentId: document.id,
            skipped: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Enhanced semantic chunking for better RAG
    console.log('Starting semantic chunking with improved algorithm');
    const chunks = splitIntoEnhancedSemanticChunks(textContent, document.type);
    console.log(`Split document into ${chunks.length} semantically meaningful chunks`);

    // Process each chunk and get embeddings
    const embeddingPromises = chunks.map(async (chunk, index) => {
      try {
        // Get embedding from OpenAI
        const embedding = await getEmbedding(chunk.text);
        
        // Enhanced chunk metadata
        const chunkMetadata = {
          project_id: document.project_id,
          document_id: document.id,
          document_type: document.type,
          chunk_text: chunk.text,
          chunk_index: index,
          embedding: embedding,
          // Add chunk-specific metadata
          metadata: {
            document_name: document.name,
            section: chunk.section || null,
            importance: chunk.importance || 'standard',
            char_length: chunk.text.length,
            word_count: chunk.text.split(/\s+/).length,
            position_ratio: index / chunks.length
          }
        };
        
        // Insert chunk and embedding into the database
        const { error: insertError } = await supabase
          .from('project_chunks')
          .insert(chunkMetadata);

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

    // Update document with processed status and metadata
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        processed_at: new Date().toISOString(),
        chunks_count: successCount,
        processing_metadata: {
          success_rate: successCount / chunks.length,
          total_chunks: chunks.length,
          model_used: 'text-embedding-ada-002',
          processing_date: new Date().toISOString()
        }
      })
      .eq('id', document.id);
    
    if (updateError) {
      console.warn(`Warning: Failed to update document metadata: ${updateError.message}`);
    }

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

// Enhanced semantic chunking function with better metadata
function splitIntoEnhancedSemanticChunks(text, documentType) {
  const chunks = [];
  const maxChunkSize = 1500; // Optimal size for embedding
  
  // Enhanced chunking for different document types
  if (documentType === 'data-model' || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    // Special handling for JSON/data model documents
    try {
      // JSON parsing and entity extraction
      let jsonObj;
      if (typeof text === 'string') {
        try {
          jsonObj = JSON.parse(text);
        } catch (e) {
          return splitTextByLineGroups(text, maxChunkSize);
        }
      } else {
        jsonObj = text;
      }
      
      // Enhanced entity-aware chunking for data models
      if (jsonObj && typeof jsonObj === 'object') {
        // Handle entities specifically for better RAG context
        if (jsonObj.entities || jsonObj.models || jsonObj.tables) {
          const entityContainer = jsonObj.entities || jsonObj.models || jsonObj.tables;
          
          // Create a schema overview chunk with high importance
          const schemaOverview = {
            text: `DATA MODEL SCHEMA OVERVIEW:\n\n${JSON.stringify(Object.keys(entityContainer), null, 2)}`,
            section: 'Schema Overview',
            importance: 'high'
          };
          chunks.push(schemaOverview);
          
          // Process each entity individually for better retrieval
          for (const [entityName, entityDef] of Object.entries(entityContainer)) {
            const entityChunk = {
              text: `ENTITY: ${entityName}\n\n${JSON.stringify(entityDef, null, 2)}`,
              section: `Entity: ${entityName}`,
              importance: 'high'
            };
            chunks.push(entityChunk);
          }
          
          // Add relationship information if available
          if (jsonObj.relationships) {
            const relationshipsChunk = {
              text: `RELATIONSHIPS:\n\n${JSON.stringify(jsonObj.relationships, null, 2)}`,
              section: 'Relationships',
              importance: 'high'
            };
            chunks.push(relationshipsChunk);
          }
          
          return chunks;
        }
        
        // For other JSON structures, use the standard approach with improved metadata
        // ... keep existing code (JSON chunking logic)
      }
    } catch (e) {
      console.error("Error processing JSON document:", e);
      return splitTextByLineGroups(text, maxChunkSize);
    }
  } else {
    // For PDFs and other text documents, use enhanced semantic splitting
    return splitTextByEnhancedSemanticStructure(text, maxChunkSize);
  }
  
  return chunks;
}

// Enhanced semantic structure extraction with better section detection
function splitTextByEnhancedSemanticStructure(text, maxChunkSize) {
  const chunks = [];
  
  // Advanced regex patterns for technical document sections
  const sectionPatterns = [
    // Headers with numbers (e.g., "1.2.3 Section Title")
    /(?:^|\n)(?:\d+(?:\.\d+)*\s+)([A-Z][A-Za-z0-9\s:,-]+)(?:\r?\n)/g,
    
    // Markdown/RST style headers
    /(?:^|\n)(?:#{1,6}\s+)([A-Z][A-Za-z0-9\s:,-]+)(?:\r?\n)/g,
    
    // Uppercase section markers
    /(?:^|\n)(?:SECTION|CHAPTER|PART|MODULE|APPENDIX)\s+\d+[.:]\s*([A-Z][A-Za-z0-9\s:,-]+)(?:\r?\n)/g,
    
    // Common document section labels
    /(?:^|\n)(?:Introduction|Background|Methodology|Requirements|Conclusion|References|Summary|Overview|Appendix)(?:\r?\n)/g
  ];
  
  // Find all section boundaries with improved pattern recognition
  let matches = [];
  for (const pattern of sectionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const title = match[1] || match[0].trim();
      matches.push({
        index: match.index,
        length: match[0].length,
        title: title
      });
    }
  }
  
  // Sort matches by position in text
  matches.sort((a, b) => a.index - b.index);
  
  // If we found section breaks, process each section
  if (matches.length > 0) {
    // Create a document overview section (crucial for context)
    const documentOverview = {
      text: `DOCUMENT OVERVIEW\n\n${matches.map(m => m.title).join("\n")}`,
      section: "Document Overview",
      importance: "high"
    };
    chunks.push(documentOverview);
    
    // Process each section
    for (let i = 0; i < matches.length; i++) {
      const startPos = matches[i].index;
      const endPos = (i < matches.length - 1) ? matches[i + 1].index : text.length;
      const section = text.substring(startPos, endPos);
      const sectionTitle = matches[i].title;
      
      // Skip tiny sections (likely false positives)
      if (section.length < 50) continue;
      
      // For small enough sections, keep them together
      if (section.length <= maxChunkSize) {
        chunks.push({
          text: section.trim(),
          section: sectionTitle,
          importance: getSectionImportance(sectionTitle)
        });
      } else {
        // Split large sections into coherent chunks
        const sectionChunks = splitLargeSection(section, sectionTitle, maxChunkSize);
        chunks.push(...sectionChunks);
      }
    }
    
    return chunks;
  }
  
  // If no clear sections found, fall back to paragraph-based splitting
  return splitByEnhancedParagraphGroups(text, maxChunkSize);
}

// Determine section importance based on content cues
function getSectionImportance(sectionTitle) {
  const lowerTitle = sectionTitle.toLowerCase();
  
  // High importance sections
  if (
    lowerTitle.includes('requirement') ||
    lowerTitle.includes('introduction') ||
    lowerTitle.includes('overview') ||
    lowerTitle.includes('scope') ||
    lowerTitle.includes('objective') ||
    lowerTitle.includes('feature') ||
    lowerTitle.includes('functional') ||
    lowerTitle.includes('architecture')
  ) {
    return 'high';
  }
  
  // Medium importance
  if (
    lowerTitle.includes('background') ||
    lowerTitle.includes('summary') ||
    lowerTitle.includes('conclusion') ||
    lowerTitle.includes('design')
  ) {
    return 'medium';
  }
  
  // Standard importance
  return 'standard';
}

// Enhanced version of splitting large sections with context preservation
function splitLargeSection(section, sectionTitle, maxChunkSize) {
  const chunks = [];
  
  // Detect if section contains code blocks
  const hasCodeBlocks = section.includes('```') || 
                       section.includes('    ') || 
                       section.includes('<code>');
  
  // If section has code, use special handling to keep code blocks intact
  if (hasCodeBlocks) {
    const codeBlockChunks = splitPreservingCodeBlocks(section, sectionTitle, maxChunkSize);
    return codeBlockChunks;
  }
  
  // Otherwise split by paragraphs with context headers
  const paragraphs = section.split(/\n\n+/);
  let currentChunk = "";
  let subSectionIndex = 0;
  
  // Always include section title context in each chunk
  const contextHeader = `${sectionTitle}\n\n`;
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size
    if (currentChunk.length + paragraph.length + 10 > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        section: `${sectionTitle} (part ${subSectionIndex + 1})`,
        importance: getSectionImportance(sectionTitle)
      });
      
      currentChunk = contextHeader; // Reset with context header
      subSectionIndex++;
    }
    
    // Initialize chunk with context header if it's empty
    if (currentChunk.length === 0) {
      currentChunk = contextHeader;
    }
    
    // Add paragraph
    currentChunk += paragraph + "\n\n";
  }
  
  // Don't forget the last chunk
  if (currentChunk.length > contextHeader.length) {
    chunks.push({
      text: currentChunk.trim(),
      section: `${sectionTitle} (part ${subSectionIndex + 1})`,
      importance: getSectionImportance(sectionTitle)
    });
  }
  
  return chunks;
}

// Split text preserving code blocks
function splitPreservingCodeBlocks(text, sectionTitle, maxChunkSize) {
  const chunks = [];
  const codeBlockRegex = /(```[\s\S]*?```|    [\s\S]*?\n\n|<code>[\s\S]*?<\/code>)/g;
  
  // Split text into code blocks and non-code content
  const parts = text.split(codeBlockRegex);
  
  let currentChunk = "";
  let subSectionIndex = 0;
  const contextHeader = `${sectionTitle}\n\n`;
  
  for (const part of parts) {
    // If this is a code block
    const isCodeBlock = part.startsWith('```') || 
                        part.startsWith('    ') || 
                        part.startsWith('<code>');
    
    // If adding this part would exceed max size
    if (currentChunk.length + part.length + 10 > maxChunkSize) {
      // But if it's a code block that needs to stay intact
      if (isCodeBlock && currentChunk.length > contextHeader.length) {
        // Finish current chunk
        chunks.push({
          text: currentChunk.trim(),
          section: `${sectionTitle} (part ${subSectionIndex + 1})`,
          importance: getSectionImportance(sectionTitle)
        });
        
        // Start a new chunk with the code block
        currentChunk = contextHeader + part;
        subSectionIndex++;
      } 
      // If current part is not a code block, we can split it
      else if (!isCodeBlock) {
        // Finish current chunk
        chunks.push({
          text: currentChunk.trim(),
          section: `${sectionTitle} (part ${subSectionIndex + 1})`,
          importance: getSectionImportance(sectionTitle)
        });
        
        // Start a new chunk
        currentChunk = contextHeader + part;
        subSectionIndex++;
      }
      // If code block is too large on its own
      else {
        // Keep code block with context in a single chunk even if it's large
        chunks.push({
          text: (contextHeader + part).trim(),
          section: `${sectionTitle} (code block)`,
          importance: 'high' // Code blocks often have high importance
        });
        
        currentChunk = contextHeader;
      }
    } else {
      // Add part to current chunk
      if (currentChunk.length === 0) {
        currentChunk = contextHeader + part;
      } else {
        currentChunk += part;
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.length > contextHeader.length) {
    chunks.push({
      text: currentChunk.trim(),
      section: `${sectionTitle} (part ${subSectionIndex + 1})`,
      importance: getSectionImportance(sectionTitle)
    });
  }
  
  return chunks;
}

// Enhanced paragraph grouping with better context preservation
function splitByEnhancedParagraphGroups(text, maxChunkSize) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = "";
  let paragraphIndex = 0;
  
  for (const paragraph of paragraphs) {
    // Skip empty paragraphs
    if (!paragraph.trim()) continue;
    
    // If adding this paragraph would exceed max size
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        section: `Text Section ${paragraphIndex}`,
        importance: 'standard'
      });
      
      currentChunk = "";
    }
    
    currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
    
    // Check for topic shifts within paragraphs to improve chunking
    if (detectTopicShift(paragraph)) {
      chunks.push({
        text: currentChunk.trim(),
        section: `Text Section ${paragraphIndex}`,
        importance: 'standard'
      });
      
      currentChunk = "";
      paragraphIndex++;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      section: `Text Section ${paragraphIndex}`,
      importance: 'standard'
    });
  }
  
  return chunks;
}

// Simple topic shift detection based on language cues
function detectTopicShift(paragraph) {
  const topicShiftCues = [
    "however,", "on the other hand", "in contrast", "similarly", 
    "furthermore", "moving on", "next", "additionally",
    "in summary", "to conclude", "finally"
  ];
  
  const lowerParagraph = paragraph.toLowerCase();
  return topicShiftCues.some(cue => lowerParagraph.includes(cue));
}

// Keep original line-based chunking for fallback
function splitTextByLineGroups(text, maxChunkSize) {
  const chunks = [];
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

// Function to get embeddings from OpenAI API with improved error handling
async function getEmbedding(text) {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
        // If rate limited, wait and retry
        if (response.status === 429 && attempt < maxRetries) {
          console.log(`Rate limited, waiting before retry ${attempt}/${maxRetries}`);
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }
        throw new Error(`OpenAI API error: ${errorResponse.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      if (attempt < maxRetries) {
        console.warn(`Embedding attempt ${attempt} failed: ${error.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
      } else {
        console.error(`Failed to get embedding after ${maxRetries} attempts: ${error.message}`);
        throw error;
      }
    }
  }
}
