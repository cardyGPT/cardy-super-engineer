
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
      documentIds: documentIds.length,
      message: message?.substring(0, 100) // Log first 100 chars of query for debugging
    });
    
    if (!message) {
      throw new Error('No message provided');
    }
    
    // Create Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, check if all referenced documents have been processed
    let documentNames = [];
    if (documentIds.length > 0) {
      // Get document names for logging and response context
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('id, name, type')
        .in('id', documentIds);
      
      if (!docError && docData) {
        documentNames = docData.map(doc => doc.name);
        console.log("Selected documents:", documentNames);
      }
      
      // Check for processed chunks
      const { data: processedDocs, error: checkError } = await supabase
        .from('project_chunks')
        .select('document_id')
        .in('document_id', documentIds);
      
      if (checkError) {
        console.error("Error checking processed documents:", checkError);
      } else {
        // Get unique document IDs that have been processed
        const processedDocIds = [...new Set(processedDocs?.map(d => d.document_id) || [])];
        
        // Check if any documents haven't been processed
        const unprocessedDocs = documentIds.filter(id => !processedDocIds.includes(id));
        
        if (unprocessedDocs.length > 0) {
          console.log(`Processing unprocessed documents: ${unprocessedDocs.join(', ')}`);
          
          // Process unprocessed documents
          for (const docId of unprocessedDocs) {
            try {
              await supabase.functions.invoke('process-document', {
                body: { documentId: docId }
              });
              console.log(`Triggered processing for document: ${docId}`);
            } catch (e) {
              console.error(`Failed to process document ${docId}:`, e);
            }
          }
          
          // Give some time for processing to complete
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
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
    const filter = {} as Record<string, any>;
    if (projectId) {
      filter.project_id = projectId;
    }
    
    if (documentIds.length > 0) {
      filter.document_ids = documentIds;
    }
    
    console.log("Using filter for document search:", filter);
    
    // Use vector similarity search function to find relevant document chunks
    const { data: relevantChunks, error: searchError } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: embedding,
        match_threshold: 0.5,  // Threshold for similarity
        match_count: 30,       // Increased number of matches for better context
        filter: filter
      }
    );
    
    if (searchError) {
      console.error("Error in similarity search:", searchError);
      throw new Error(`Error retrieving relevant document chunks: ${searchError.message}`);
    }
    
    console.log(`Retrieved ${relevantChunks?.length || 0} relevant document chunks`);
    
    // If no chunks were found, check if there are any chunks at all for the selected documents
    if (!relevantChunks || relevantChunks.length === 0) {
      console.log("No relevant chunks found, checking for any chunks from the selected documents");
      
      // If project id is provided, try to get any chunks from that project
      let docQuery = supabase.from('project_chunks').select('*');
      
      if (projectId) {
        docQuery = docQuery.eq('project_id', projectId);
      }
      
      if (documentIds.length > 0) {
        docQuery = docQuery.in('document_id', documentIds);
      }
      
      docQuery = docQuery.limit(30);
      
      const { data: anyChunks, error: anyChunksError } = await docQuery;
      
      if (anyChunksError) {
        console.error("Error retrieving any chunks:", anyChunksError);
      } else if (anyChunks && anyChunks.length > 0) {
        console.log(`Found ${anyChunks.length} chunks without similarity search`);
        
        // Try to get raw documents directly if chunks are missing
        const { data: docNames, error: docNamesError } = await supabase
          .from('documents')
          .select('id, name')
          .in('id', anyChunks.map(chunk => chunk.document_id));
          
        if (!docNamesError && docNames) {
          // Create a map of document IDs to names
          const docNameMap = docNames.reduce((map, doc) => {
            map[doc.id] = doc.name;
            return map;
          }, {});
          
          // Add document names and a neutral similarity score
          relevantChunks = anyChunks.map(chunk => ({
            ...chunk,
            document_name: docNameMap[chunk.document_id] || 'Unknown Document',
            similarity: 0.7  // Neutral score
          }));
        }
      }

      // If still no chunks, try to extract content directly from the documents table
      if (!relevantChunks || relevantChunks.length === 0) {
        let docsQuery = supabase.from('documents').select('id, name, content, type');
        
        if (projectId) {
          docsQuery = docsQuery.eq('project_id', projectId);
        }
        
        if (documentIds.length > 0) {
          docsQuery = docsQuery.in('id', documentIds);
        }
        
        const { data: rawDocs, error: rawDocsError } = await docsQuery;
        
        if (rawDocsError) {
          console.error("Error retrieving raw documents:", rawDocsError);
        } else if (rawDocs && rawDocs.length > 0) {
          console.log(`Retrieved ${rawDocs.length} documents directly from the documents table`);
          
          // Create synthetic chunks from the raw document content
          const syntheticChunks = [];
          for (const doc of rawDocs) {
            if (doc.content) {
              let contentText = "";
              if (typeof doc.content === 'string') {
                contentText = doc.content;
              } else if (typeof doc.content === 'object') {
                try {
                  contentText = JSON.stringify(doc.content, null, 2);
                } catch (e) {
                  console.warn(`Error stringifying content for document ${doc.name}:`, e);
                  contentText = "Error processing document content";
                }
              }
              
              // Create synthetic chunks (simplified for now)
              const chunkSize = 1000;
              for (let i = 0; i < contentText.length; i += chunkSize) {
                const chunkText = contentText.substring(i, i + chunkSize);
                syntheticChunks.push({
                  id: `synthetic-${doc.id}-${i}`,
                  project_id: projectId || "unknown",
                  document_id: doc.id,
                  document_type: doc.type,
                  document_name: doc.name,
                  chunk_text: chunkText,
                  chunk_index: Math.floor(i / chunkSize),
                  similarity: 0.6  // Lower similarity to prioritize real chunks
                });
              }
            }
          }
          
          console.log(`Created ${syntheticChunks.length} synthetic chunks from raw document content`);
          relevantChunks = syntheticChunks;
        }
      }
    }
    
    // Build context from the relevant chunks
    let documentsContext = '';
    let usedDocuments = new Set();
    
    if (relevantChunks && relevantChunks.length > 0) {
      // Group chunks by document for better context
      const documentGroups = relevantChunks.reduce((groups, chunk) => {
        const docName = chunk.document_name;
        usedDocuments.add(docName);
        if (!groups[docName]) {
          groups[docName] = [];
        }
        groups[docName].push(chunk);
        return groups;
      }, {});
      
      // Format each document's chunks
      for (const [docName, chunks] of Object.entries(documentGroups)) {
        documentsContext += `=== Document: ${docName} ===\n\n`;
        // Sort chunks by their original order in the document
        const sortedChunks = chunks.sort((a, b) => a.chunk_index - b.chunk_index);
        
        for (const chunk of sortedChunks) {
          documentsContext += `${chunk.chunk_text}\n\n`;
        }
        documentsContext += '===\n\n';
      }
    }
    
    const systemPrompt = `You are Cardy Mind, an advanced RAG-powered AI assistant that helps users understand their project documents.
    Your goal is to provide detailed, accurate, and helpful responses based on the document context provided.
    
    When responding:
    - Be thorough and precise, citing specific sections from documents when relevant
    - Always include document citations using the format [Document: NAME] when referencing information
    - For technical documents, maintain the same level of technical detail as in the source
    - When asked about specific documents, focus your response on those documents
    - For JSON documents or data models, explain the structure and relationships clearly
    - If the information isn't in the provided documents, clearly state this fact
    - Never make up information that isn't present in the documents
    - When details are missing, suggest what additional information might be helpful
    
    You are working on a project with critical documentation, and your responses should reflect the authoritative nature of these documents.`;

    // Create messages array with system prompt, document context, and user message
    const messages = [
      { role: "system", content: systemPrompt },
    ];
    
    // Add documents context if available
    if (documentsContext) {
      messages.push({ 
        role: "system", 
        content: `Here are the relevant sections from your project documents to reference:\n\n${documentsContext}` 
      });
    } else {
      messages.push({
        role: "system",
        content: "Warning: No relevant document content was found for this query. Please ensure documents are properly indexed or try refining your question."
      });
    }
    
    // If we're asking about a specific document, add a special instruction
    const documentMentions = message.match(/\b[A-Za-z0-9_-]+\.(pdf|doc|docx|json|txt)\b/gi);
    if (documentMentions?.length > 0) {
      const mentionedDocs = documentMentions.join(', ');
      messages.push({
        role: "system",
        content: `The user is asking specifically about document(s): ${mentionedDocs}. If you have content from these documents, focus your answer on that content.`
      });
    }
    
    // Add instruction to structure the response format
    messages.push({
      role: "system",
      content: `
      Format your response as follows:
      1. Start with a direct answer to the question
      2. Follow with supporting details from the documents, including citations
      3. If appropriate, summarize key points at the end
      
      Always cite documents using [Document: Name] format when referencing specific information.
      `
    });
    
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
        model: 'gpt-4o',  // Using the latest model for best results
        messages: messages,
        temperature: 0.2,  // Lower temperature for more factual responses
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

    return new Response(JSON.stringify({
      response: data.choices[0].message.content,
      usage: data.usage,
      contextSize: documentsContext.length,
      documentsUsed: Array.from(usedDocuments),
      relevantDocuments: relevantChunks ? relevantChunks.map(chunk => ({
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
