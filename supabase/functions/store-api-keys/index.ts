
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Add detailed logging
  console.log(`API key storage function received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { provider, apiKey, clientId, clientSecret } = await req.json();
    
    console.log(`Received request to store API key for ${provider}`);
    
    // Validate request
    if (!provider || (!apiKey && !clientId && !clientSecret)) {
      console.error("Invalid request: provider and at least one credential are required");
      return new Response(
        JSON.stringify({ error: "Provider and at least one credential (API key, Client ID, or Client Secret) are required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Store credentials in the api_keys table
    const credentials = [];
    const updates = {};
    
    if (apiKey) {
      updates['api_key'] = apiKey;
      credentials.push('API key');
    }
    
    if (clientId) {
      updates['client_id'] = clientId;
      credentials.push('Client ID');
    }
    
    if (clientSecret) {
      updates['client_secret'] = clientSecret;
      credentials.push('Client Secret');
    }
    
    // First check if there's already an entry for this provider
    const { data: existingData, error: findError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('service', provider)
      .maybeSingle();
      
    if (findError) {
      console.error(`Error checking for existing ${provider} credentials:`, findError);
      throw new Error(`Failed to check for existing ${provider} credentials`);
    }
    
    let result;
    
    if (existingData) {
      // Update existing row
      const { data, error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('service', provider)
        .select();
        
      if (error) {
        console.error(`Error updating ${provider} credentials:`, error);
        throw new Error(`Failed to update ${provider} credentials`);
      }
      
      result = data;
      console.log(`Updated credentials for ${provider}`);
      
    } else {
      // Insert new row
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          service: provider,
          ...updates
        })
        .select();
        
      if (error) {
        console.error(`Error storing ${provider} credentials:`, error);
        throw new Error(`Failed to store ${provider} credentials`);
      }
      
      result = data;
      console.log(`Stored new credentials for ${provider}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Stored ${credentials.join(', ')} for ${provider} successfully`,
        storedCredentials: credentials
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error storing credentials:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
