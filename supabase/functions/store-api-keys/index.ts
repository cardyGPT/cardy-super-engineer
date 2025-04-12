
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { provider, apiKey } = await req.json();
    
    // Validate request
    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Provider and API key are required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Validate provider
    const validProviders = ['openai', 'gsuite', 'jira'];
    if (!validProviders.includes(provider.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Store API key securely as an environment variable
    const envVarName = `${provider.toUpperCase()}_API_KEY`;
    
    // Set the environment variable
    Deno.env.set(envVarName, apiKey);
    
    console.log(`${provider.toUpperCase()} API key stored successfully`);
    
    return new Response(
      JSON.stringify({ success: true, message: `${provider} API key stored successfully` }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error storing API key:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
