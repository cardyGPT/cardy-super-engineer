
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log("Received request to delete GSuite configuration");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete the GSuite API keys
    const { error: keysError } = await supabase
      .from('api_keys')
      .delete()
      .eq('service', 'gsuite');
      
    if (keysError) {
      console.error("Error deleting GSuite API keys:", keysError);
      throw new Error("Failed to delete GSuite API keys");
    }
    
    // Delete the GSuite settings
    const { error: settingsError } = await supabase
      .from('settings')
      .delete()
      .eq('service', 'gsuite');
      
    if (settingsError) {
      console.error("Error deleting GSuite settings:", settingsError);
      throw new Error("Failed to delete GSuite settings");
    }
    
    console.log("GSuite configuration deleted successfully");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "GSuite configuration deleted successfully"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error deleting GSuite configuration:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
