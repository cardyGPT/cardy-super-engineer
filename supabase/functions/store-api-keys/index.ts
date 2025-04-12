
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = "https://gswwmieyrfdhrfwsgjnw.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Provider and API key are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate provider
    if (!['openai', 'gsuite'].includes(provider)) {
      return new Response(
        JSON.stringify({ error: 'Invalid provider. Must be "openai" or "gsuite"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Store the API key securely
    // For OpenAI, we'll set it in the env var of the validate-openai function
    if (provider === 'openai') {
      // Create or update the OPENAI_API_KEY secret
      const secretsResponse = await fetch(
        `${supabaseUrl}/functions/v1/config/secrets`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            OPENAI_API_KEY: apiKey
          })
        }
      );

      if (!secretsResponse.ok) {
        const error = await secretsResponse.json();
        console.error("Error saving OpenAI API key:", error);
        throw new Error("Failed to save OpenAI API key to environment variables");
      }
    } else if (provider === 'gsuite') {
      // Store GSuite API key
      const secretsResponse = await fetch(
        `${supabaseUrl}/functions/v1/config/secrets`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            GSUITE_API_KEY: apiKey
          })
        }
      );

      if (!secretsResponse.ok) {
        const error = await secretsResponse.json();
        console.error("Error saving GSuite API key:", error);
        throw new Error("Failed to save GSuite API key to environment variables");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `${provider} API key stored successfully` }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error(`Error storing API key:`, error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error storing API key' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
