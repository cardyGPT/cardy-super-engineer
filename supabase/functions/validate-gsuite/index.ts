
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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
    // Create a Supabase client to query the database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch GSuite credentials from the database
    const { data: gsuiteCreds, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('service', 'gsuite')
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error fetching GSuite credentials:", fetchError);
      throw new Error("Failed to fetch GSuite credentials from the database");
    }
    
    console.log("Checking GSuite configuration...");
    
    const apiKey = gsuiteCreds?.api_key;
    const clientId = gsuiteCreds?.client_id;
    const clientSecret = gsuiteCreds?.client_secret;
    
    console.log("API Key exists:", !!apiKey);
    console.log("Client ID exists:", !!clientId);
    console.log("Client Secret exists:", !!clientSecret);
    
    // Fetch GSuite settings
    const { data: gsuiteSettings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('service', 'gsuite')
      .maybeSingle();
      
    if (settingsError && settingsError.message !== 'No rows found') {
      console.error("Error fetching GSuite settings:", settingsError);
    }
    
    console.log("Settings exist:", !!gsuiteSettings);
    
    // More detailed validation - credentials should have reasonable length
    const isApiKeyValid = !!apiKey && apiKey.length > 10;
    const isClientIdValid = !!clientId && clientId.length > 10;
    const isClientSecretValid = !!clientSecret && clientSecret.length > 10;
    
    // At least one credential should be valid
    const hasValidCredentials = isApiKeyValid || (isClientIdValid && isClientSecretValid);
    const settingsValid = !!gsuiteSettings;
    
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
    } else if (!settingsValid) {
      message = "GSuite settings are not configured";
    } else if (success) {
      message = "GSuite configuration is valid";
    } else {
      message = "GSuite configuration is incomplete or invalid";
    }
    
    return new Response(
      JSON.stringify({ 
        valid: success,
        settings: gsuiteSettings,
        message: message,
        hasApiKey: !!apiKey,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasSettings: !!gsuiteSettings
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
