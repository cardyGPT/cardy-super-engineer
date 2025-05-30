
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const body = await req.json();
    const { prompt, systemPrompt, maxTokens = 4000, temperature = 0.7 } = body;
    
    // Validate request
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Get the OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    console.log("Calling OpenAI API with prompt:", prompt.substring(0, 100) + "...");
    
    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: systemPrompt || 'You are a helpful assistant that generates technical documentation and code based on user requirements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(error.error?.message || "Error calling OpenAI API");
    }
    
    const data = await response.json();
    console.log("OpenAI API response received. Token usage:", data.usage);
    
    return new Response(
      JSON.stringify({ 
        content: data.choices[0].message.content,
        usage: data.usage
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error generating content:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
