
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
    // Check if GSuite API key and client secret are stored and valid
    const apiKey = Deno.env.get('GSUITE_API_KEY');
    const clientSecret = Deno.env.get('GSUITE_CLIENT_SECRET');
    const settingsJson = Deno.env.get('GSUITE_SETTINGS');
    
    console.log("Checking GSuite configuration...");
    console.log("API Key exists:", !!apiKey);
    console.log("Client Secret exists:", !!clientSecret);
    console.log("Settings exist:", !!settingsJson);
    
    // More detailed validation - API key and client secret should have reasonable length
    const isApiKeyValid = !!apiKey && apiKey.length > 10;
    const isClientSecretValid = !!clientSecret && clientSecret.length > 10;
    
    let settings = null;
    let settingsValid = false;
    
    if (settingsJson) {
      try {
        settings = JSON.parse(settingsJson);
        console.log("Parsed settings:", settings);
        
        // Validate that settings has required properties
        settingsValid = !!settings && 
          typeof settings === 'object' && 
          settings.metadata && 
          settings.metadata.lastUpdated;
          
      } catch (e) {
        console.error("Error parsing GSuite settings:", e);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: "Invalid GSuite settings format",
            message: "Error parsing GSuite configuration: " + e.message
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
    }
    
    // For successful validation, API key, client secret, and settings should be present and valid
    const success = isApiKeyValid && isClientSecretValid && settingsValid;
    
    let message;
    if (!apiKey) {
      message = "GSuite API key is not configured";
    } else if (!isApiKeyValid) {
      message = "GSuite API key appears to be invalid";
    } else if (!clientSecret) {
      message = "GSuite client secret is not configured";
    } else if (!isClientSecretValid) {
      message = "GSuite client secret appears to be invalid";
    } else if (!settings) {
      message = "GSuite settings are not configured";
    } else if (!settingsValid) {
      message = "GSuite settings are incomplete";
    } else if (success) {
      message = "GSuite configuration is valid";
    } else {
      message = "GSuite configuration is incomplete or invalid";
    }
    
    return new Response(
      JSON.stringify({ 
        valid: success,
        settings: settings,
        message: message,
        hasApiKey: !!apiKey,
        hasClientSecret: !!clientSecret,
        hasSettings: !!settings
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
