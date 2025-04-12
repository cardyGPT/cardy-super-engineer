
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Add detailed logging
  console.log(`GSuite settings function received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const settings = await req.json();
    
    console.log("Received settings payload:", settings);
    
    // Validate request
    if (!settings) {
      console.error("No settings payload provided");
      return new Response(
        JSON.stringify({ error: "Settings are required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Enhance settings with metadata for validation purposes
    const enhancedSettings = {
      ...settings,
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: "1.0",
        status: "active"
      }
    };
    
    // Store settings securely as an environment variable
    const settingsStr = JSON.stringify(enhancedSettings);
    
    // First verify we have an API key
    const apiKey = Deno.env.get('GSUITE_API_KEY');
    
    if (!apiKey && !settings.skipApiKeyCheck) {
      console.error("Cannot save settings: No GSuite API key found");
      return new Response(
        JSON.stringify({ 
          error: "No GSuite API key found. Please save an API key first.", 
          valid: false,
          message: "GSuite API key is required before saving settings."
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Set the environment variable
    Deno.env.set('GSUITE_SETTINGS', settingsStr);
    
    console.log("GSuite settings stored successfully:", enhancedSettings);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "GSuite settings stored successfully",
        settings: enhancedSettings,
        valid: true
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error storing GSuite settings:", err);
    
    return new Response(
      JSON.stringify({ 
        error: err.message,
        valid: false,
        message: "Error storing GSuite settings: " + err.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
