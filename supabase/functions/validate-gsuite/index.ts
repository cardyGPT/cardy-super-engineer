
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
    // Get the GSuite API key from environment variables
    const gsuiteApiKey = Deno.env.get('GSUITE_API_KEY');
    
    if (!gsuiteApiKey) {
      console.log("GSuite API key not found in environment variables");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: "GSuite API key is not configured" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // Load GSuite settings, if they exist
    let settings = null;
    try {
      const settingsStr = Deno.env.get('GSUITE_SETTINGS');
      if (settingsStr) {
        settings = JSON.parse(settingsStr);
      }
    } catch (err) {
      console.warn("Error parsing GSuite settings:", err);
      // Continue with null settings
    }
    
    // Test the API key by making a simple request to Google API
    try {
      // Simple test request to Drive API
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${gsuiteApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Invalid API key");
      }
      
      console.log("GSuite API key is valid");
      
      return new Response(
        JSON.stringify({ 
          valid: true,
          settings
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } catch (err) {
      console.error("Error validating GSuite API key:", err);
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: err.message || "Invalid API key",
          settings
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
  } catch (err) {
    console.error("Server error:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
