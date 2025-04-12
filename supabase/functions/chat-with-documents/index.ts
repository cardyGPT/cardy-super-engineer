
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, documentsContext } = await req.json();
    
    console.log("Chat with documents request received:", {
      messageLength: message?.length || 0,
      documentsCount: documentsContext ? documentsContext.split('---').length : 0,
    });
    
    if (!message) {
      throw new Error('No message provided');
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
        content: `Here are the project documents to reference:\n\n${documentsContext}` 
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
