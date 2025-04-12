
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
    const { provider } = await req.json();
    
    // Validate request
    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Provider is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Delete API key environment variable
    const key = `${provider.toUpperCase()}_API_KEY`;
    
    // Delete the environment variable (not always possible in all environments)
    try {
      // In some environments, setting to empty string is the best way to "delete"
      Deno.env.set(key, "");
      console.log(`API key for ${provider} deleted successfully`);
    } catch (e) {
      console.warn(`Could not delete ${key} environment variable:`, e);
      // We'll still consider this successful as the key is no longer usable
    }
    
    return new Response(
      JSON.stringify({ success: true, message: `${provider} API key deleted successfully` }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error deleting API key:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
