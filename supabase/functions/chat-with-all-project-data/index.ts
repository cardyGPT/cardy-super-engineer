
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create a Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are not configured');
    }

    // Parse the request
    const { messages, documents } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages are required and must be an array');
    }

    // Extract the latest user message for vectorization
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) {
      throw new Error('At least one user message is required');
    }
    
    const lastUserMessage = userMessages[userMessages.length - 1].content;
    console.log(`Processing query: "${lastUserMessage.substring(0, 100)}..."`);

    // Get embedding for the query
    const embedding = await getEmbedding(lastUserMessage);
    console.log('Generated query embedding');

    // Prepare filter for document retrieval
    const filter = { document_ids: [] };
    let projectIds = new Set();

    // Process documents to extract IDs
    if (documents && Array.isArray(documents)) {
      documents.forEach(doc => {
        if (doc.id) {
          filter.document_ids.push(doc.id);
        }
        if (doc.projectId) {
          projectIds.add(doc.projectId);
        }
      });
    }

    console.log(`Searching with filter: ${filter.document_ids.length} documents, ${projectIds.size} projects`);

    // Enhanced RAG: First try with high similarity threshold
    let relevantChunks = await getRelevantChunks(embedding, 0.75, 10, filter);
    
    // If not enough high-quality matches, try with lower threshold
    if (relevantChunks.length < 3) {
      console.log(`Only found ${relevantChunks.length} high-relevance chunks, trying with lower threshold`);
      relevantChunks = await getRelevantChunks(embedding, 0.65, 15, filter);
    }
    
    // Add keyword search as fallback
    if (relevantChunks.length < 2) {
      console.log('Vector search yielded insufficient results, adding keyword search');
      const keywordChunks = await keywordSearch(lastUserMessage, filter, 5);
      
      // Combine and deduplicate results
      const allChunkIds = new Set(relevantChunks.map(c => c.id));
      for (const chunk of keywordChunks) {
        if (!allChunkIds.has(chunk.id)) {
          relevantChunks.push(chunk);
          allChunkIds.add(chunk.id);
        }
      }
    }
    
    console.log(`Retrieved ${relevantChunks.length} relevant chunks`);

    // Enhanced context management: Sort chunks by priority
    relevantChunks = prioritizeChunks(relevantChunks);
    
    // Prepare document context
    let documentContext = '';
    const includedProjects = new Set();

    if (relevantChunks.length > 0) {
      // Build context from chunks with metadata for better answers
      documentContext = relevantChunks.map((chunk, i) => {
        // Track projects for reference
        if (chunk.project_id) {
          includedProjects.add(chunk.project_id);
        }
        
        // Format chunks with metadata
        const chunkHeader = chunk.document_name ? 
          `DOCUMENT: ${chunk.document_name} (${chunk.document_type || 'document'})` : 
          `DOCUMENT ${i+1} (${chunk.document_type || 'document'})`;
          
        return `--- ${chunkHeader} ---\n${chunk.chunk_text}\n`;
      }).join('\n\n');
    } else {
      documentContext = "No relevant document context found. Please provide a general response based on your knowledge.";
    }

    // Calculate token usage stats
    const contextTokens = countApproximateTokens(documentContext);
    const promptTokens = countApproximateTokens(JSON.stringify(messages));
    
    console.log(`Context size: ~${contextTokens} tokens, Prompt size: ~${promptTokens} tokens`);
    
    // Trim context if needed to fit token limits
    let trimmedContext = documentContext;
    if (contextTokens > 6000) {
      console.log('Context too large, trimming to fit token budget');
      trimmedContext = trimContext(documentContext, 6000);
    }

    // Enhanced prompt engineering for better RAG responses
    const enhancedSystemPrompt = `You are Cardy Mind, an AI assistant specialized in answering questions about project documentation.

CONTEXT INFORMATION:
${trimmedContext}

INSTRUCTIONS:
1. Answer the user's question using ONLY the information provided in the context above.
2. If the context doesn't contain enough information to answer fully, acknowledge this limitation.
3. DO NOT make up information that isn't in the context.
4. Return well-formatted responses using markdown for better readability.
5. For technical content, use code blocks with appropriate syntax highlighting.
6. If relevant, organize information in bullet points or tables.
7. Cite specific documents in your answer when referencing information.
8. For ambiguous questions, ask for clarification.
9. For data model questions, explain entity relationships clearly.

Remember: Your goal is to provide accurate, helpful information based solely on the project documentation provided.`;

    // Prepare messages for OpenAI
    const apiMessages = [
      { role: "system", content: enhancedSystemPrompt },
      ...messages
    ];

    // Call OpenAI API
    console.log('Calling OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: apiMessages,
        temperature: 0.2, // Lower temperature for more factual responses
        max_tokens: 1500,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const data = await openAIResponse.json();
    const completion = data.choices[0].message;

    // Format response with token usage data
    const response = {
      response: completion,
      context: {
        projects: Array.from(includedProjects),
        chunk_count: relevantChunks.length,
        documents: relevantChunks.map(c => c.document_name).filter((v, i, a) => a.indexOf(v) === i),
      },
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || promptTokens,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in chat-with-all-project-data function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Function to get embeddings from OpenAI
async function getEmbedding(text) {
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

// Enhanced function to get relevant document chunks
async function getRelevantChunks(queryEmbedding, similarity_threshold, limit, filter) {
  try {
    // Use the vector search function in the database
    const { data: chunks, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: similarity_threshold,
      match_count: limit,
      filter: filter
    });

    if (error) {
      console.error('Error in vector search:', error);
      return [];
    }

    return chunks || [];
  } catch (error) {
    console.error('Error getting relevant chunks:', error);
    return [];
  }
}

// Keyword search as fallback when vector search returns poor results
async function keywordSearch(query, filter, limit) {
  try {
    // Extract keywords from the query
    const keywords = extractKeywords(query);
    if (keywords.length === 0) return [];
    
    // Build a SQL query using LIKE operations
    let sqlQuery = `
      SELECT 
        pc.id, 
        pc.project_id, 
        pc.document_id, 
        pc.document_type, 
        pc.chunk_text, 
        pc.chunk_index, 
        d.name as document_name
      FROM 
        project_chunks pc
      JOIN 
        documents d ON pc.document_id = d.id
      WHERE 
        (${keywords.map(k => `pc.chunk_text ILIKE '%${k}%'`).join(' OR ')})
    `;
    
    // Add document filter if present
    if (filter.document_ids && filter.document_ids.length > 0) {
      sqlQuery += ` AND pc.document_id IN (${filter.document_ids.map(id => `'${id}'`).join(',')})`;
    }
    
    sqlQuery += ` LIMIT ${limit}`;
    
    const { data, error } = await supabase.from('project_chunks').select('*').limit(limit);
    
    if (error) {
      console.error('Error in keyword search:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in keyword search:', error);
    return [];
  }
}

// Extract meaningful keywords from a query
function extractKeywords(query) {
  // Remove common stop words
  const stopWords = new Set(['the', 'and', 'is', 'in', 'it', 'of', 'to', 'a', 'for', 'with', 'on', 'an', 'this', 'that', 'are', 'as', 'be', 'by', 'have', 'was', 'were']);
  
  // Extract words, normalize, filter stop words, and ensure minimum length
  return query.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => !stopWords.has(word) && word.length > 3);
}

// Prioritize chunks based on metadata and content
function prioritizeChunks(chunks) {
  // Define importance scores
  const typeImportance = {
    'system-requirements': 10,
    'technical-design': 8,
    'data-model': 9,
    'coding-guidelines': 7,
    'other': 5
  };

  // Score and sort chunks
  const scoredChunks = chunks.map(chunk => {
    let score = chunk.similarity * 10; // Base score from vector similarity
    
    // Add type-based score
    const docType = chunk.document_type?.toLowerCase() || 'other';
    score += typeImportance[docType] || typeImportance.other;
    
    // Prefer chunks with important keywords
    const importantTerms = ['requirement', 'must', 'shall', 'api', 'interface', 'database', 
                            'entity', 'relation', 'schema', 'class', 'function'];
    
    for (const term of importantTerms) {
      if (chunk.chunk_text.toLowerCase().includes(term)) {
        score += 0.5;
      }
    }
    
    return { ...chunk, priorityScore: score };
  });

  // Sort by priority score (descending)
  scoredChunks.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Return chunks without the temporary score field
  return scoredChunks.map(({ priorityScore, ...chunk }) => chunk);
}

// Estimate token count to manage context size
function countApproximateTokens(text) {
  // OpenAI tokenization is roughly 4 chars per token
  return Math.ceil(text.length / 4);
}

// Trim context to fit within token limits
function trimContext(context, maxTokens) {
  // If already within limits, return as-is
  if (countApproximateTokens(context) <= maxTokens) {
    return context;
  }
  
  // Split into sections
  const sections = context.split('---');
  
  // Calculate target size per section
  const maxCharsPerSection = (maxTokens * 4) / (sections.length || 1);
  
  // Trim each section proportionally
  const trimmedSections = sections.map(section => {
    if (section.length <= maxCharsPerSection) {
      return section;
    }
    
    // Preserve the header and trim the content
    const lines = section.split('\n');
    const header = lines[0];
    const content = lines.slice(1).join('\n');
    
    // Trim content to fit within budget
    const trimmedContent = content.substring(0, maxCharsPerSection - header.length - 50);
    
    return `${header}\n${trimmedContent}\n... [content trimmed to fit token limits]`;
  });
  
  return trimmedSections.join('---');
}
