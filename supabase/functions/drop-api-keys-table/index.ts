
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Add detailed logging
  console.log(`API keys table drop function received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Make a direct SQL query to drop the table
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/drop_api_keys_table`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "apikey": SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to drop table: ${errorText}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "api_keys table has been dropped"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error dropping api_keys table:", err);
    
    return new Response(
      JSON.stringify({ 
        error: err.message,
        note: "The table might not exist or you may not have sufficient permissions"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
