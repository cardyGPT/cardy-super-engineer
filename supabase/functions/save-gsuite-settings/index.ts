
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
    
    // Set the environment variable
    Deno.env.set('GSUITE_SETTINGS', settingsStr);
    
    console.log("GSuite settings stored successfully:", enhancedSettings);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "GSuite settings stored successfully",
        settings: enhancedSettings 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error storing GSuite settings:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
