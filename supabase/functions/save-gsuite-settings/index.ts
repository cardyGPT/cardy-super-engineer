
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
    
    // Ensure settings has metadata for validation
    if (!settings.metadata) {
      settings.metadata = {
        lastUpdated: new Date().toISOString(),
        version: "1.0",
        status: "active"
      };
    }
    
    // First verify we have credentials if required
    if (!settings.skipApiKeyCheck) {
      const { data: credentials, error: credError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('service', 'gsuite')
        .maybeSingle();
      
      if (credError && credError.message !== 'No rows found') {
        console.error("Error fetching GSuite credentials:", credError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to check GSuite credentials", 
            valid: false,
            message: credError.message
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
      
      if (!credentials || (!credentials.api_key && (!credentials.client_id || !credentials.client_secret))) {
        console.error("Cannot save settings: No GSuite credentials found");
        return new Response(
          JSON.stringify({ 
            error: "No GSuite credentials found. Please save an API key or Client ID/Secret first.", 
            valid: false,
            message: "GSuite credentials are required before saving settings."
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
    }
    
    // Check if there's an existing settings record
    const { data: existingSettings, error: findError } = await supabase
      .from('settings')
      .select('*')
      .eq('service', 'gsuite')
      .maybeSingle();
      
    if (findError && findError.message !== 'No rows found') {
      console.error("Error checking for existing settings:", findError);
      throw new Error("Failed to check for existing settings");
    }
    
    let result;
    
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('settings')
        .update({ 
          settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('service', 'gsuite')
        .select();
        
      if (error) {
        console.error("Error updating GSuite settings:", error);
        throw new Error("Failed to update GSuite settings");
      }
      
      result = data;
      console.log("GSuite settings updated successfully");
      
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('settings')
        .insert({
          service: 'gsuite',
          settings: settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        console.error("Error inserting GSuite settings:", error);
        throw new Error("Failed to save GSuite settings");
      }
      
      result = data;
      console.log("GSuite settings stored successfully");
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "GSuite settings stored successfully",
        settings: settings,
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
