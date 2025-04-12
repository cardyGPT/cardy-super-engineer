
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Add detailed logging
  console.log(`Delete API Key function received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { provider } = await req.json();
    
    console.log(`Removing API key for provider: ${provider}`);
    
    // Validate provider
    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Provider is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
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
    
    // Remove the environment variable
    const envVarName = `${provider.toUpperCase()}_API_KEY`;
    Deno.env.delete(envVarName);
    
    console.log(`${provider.toUpperCase()} API key removed successfully`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${provider.toUpperCase()} API key removed successfully` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error removing API key:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
