
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Add detailed request logging
  console.log(`GSuite validation function received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Check if GSuite API key is stored and valid
    const apiKey = Deno.env.get('GSUITE_API_KEY');
    const settingsJson = Deno.env.get('GSUITE_SETTINGS');
    
    console.log("Checking GSuite configuration...");
    console.log("API Key exists:", !!apiKey);
    console.log("Settings exist:", !!settingsJson);
    
    const isValid = !!apiKey && apiKey.length > 10; // Simple validation to ensure API key exists and has reasonable length
    
    let settings = null;
    if (settingsJson) {
      try {
        settings = JSON.parse(settingsJson);
        console.log("Parsed settings:", settings);
      } catch (e) {
        console.error("Error parsing GSuite settings:", e);
      }
    }
    
    // For successful validation, both API key and settings should be present
    const success = isValid && !!settings;
    
    let message;
    if (!apiKey) {
      message = "GSuite API key is not configured";
    } else if (!settings) {
      message = "GSuite settings are not configured";
    } else if (success) {
      message = "GSuite configuration is valid";
    } else {
      message = "GSuite configuration is incomplete";
    }
    
    return new Response(
      JSON.stringify({ 
        valid: success,
        settings: settings,
        message: message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error validating GSuite configuration:", err);
    
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: err.message,
        message: "Error validating GSuite configuration: " + err.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
