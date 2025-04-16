
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
    // Check if GSuite credentials are stored and valid
    const apiKey = Deno.env.get('GSUITE_API_KEY');
    const clientId = Deno.env.get('GSUITE_CLIENT_ID');
    const clientSecret = Deno.env.get('GSUITE_CLIENT_SECRET');
    const settingsJson = Deno.env.get('GSUITE_SETTINGS');
    
    console.log("Checking GSuite configuration...");
    console.log("API Key exists:", !!apiKey);
    console.log("Client ID exists:", !!clientId);
    console.log("Client Secret exists:", !!clientSecret);
    console.log("Settings exist:", !!settingsJson);
    
    // More detailed validation - credentials should have reasonable length
    const isApiKeyValid = !!apiKey && apiKey.length > 10;
    const isClientIdValid = !!clientId && clientId.length > 10;
    const isClientSecretValid = !!clientSecret && clientSecret.length > 10;
    
    // At least one credential should be valid
    const hasValidCredentials = isApiKeyValid || (isClientIdValid && isClientSecretValid);
    
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
    
    // For successful validation, valid credentials and settings should be present
    const success = hasValidCredentials && settingsValid;
    
    let message;
    if (!hasValidCredentials) {
      if (!apiKey && !clientId && !clientSecret) {
        message = "No GSuite credentials are configured";
      } else if (!isApiKeyValid && !isClientIdValid && !isClientSecretValid) {
        message = "GSuite credentials appear to be invalid";
      } else {
        message = "Incomplete GSuite credentials";
      }
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
        hasClientId: !!clientId,
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
