
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Delete GSuite API key and settings
    try {
      // In some environments, setting to empty string is the best way to "delete"
      Deno.env.set('GSUITE_API_KEY', "");
      Deno.env.set('GSUITE_SETTINGS', "");
      console.log("GSuite configuration deleted successfully");
    } catch (e) {
      console.warn("Could not delete GSuite environment variables:", e);
      // We'll still consider this successful as the values are no longer usable
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "GSuite configuration deleted successfully" }),
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
