
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  console.log("Removing api_keys table");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Execute DROP TABLE SQL
    const supabaseClient = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseClient || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }
    
    const url = `${supabaseClient}/rest/v1/rpc/remove_api_keys_table`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to drop table: ${errorText}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "api_keys table removed successfully" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error removing api_keys table:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        note: "The table might already be dropped or you may not have permissions"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
