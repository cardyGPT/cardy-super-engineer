
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
    // Get the API key from environment variables
    const apiKey = Deno.env.get("GSUITE_API_KEY");
    
    // If no API key is configured, return not valid
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'GSuite API key is not configured' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Basic validation - in a real app, you'd verify the key with Google's API
    const isValid = apiKey.length > 10;
    
    // Get the settings from KV or another permanent storage
    let settings = null;
    try {
      // In a real implementation, you'd retrieve settings from some storage
      // For this example, we'll simulate stored settings
      settings = {
        defaultDriveFolder: Deno.env.get("GSUITE_DEFAULT_FOLDER") || "",
        autoSync: Deno.env.get("GSUITE_AUTO_SYNC") === "true"
      };
    } catch (err) {
      console.error("Error retrieving GSuite settings:", err);
    }
    
    return new Response(
      JSON.stringify({ 
        valid: isValid, 
        message: isValid ? 'GSuite API key is valid' : 'GSuite API key validation failed',
        settings
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in validate-gsuite function:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        message: error.message || 'Error validating GSuite API key' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
