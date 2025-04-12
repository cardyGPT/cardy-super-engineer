
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Add detailed logging
  console.log(`Delete GSuite Config function received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log("Removing GSuite configuration...");
    
    // Remove GSuite environment variables
    Deno.env.delete('GSUITE_API_KEY');
    Deno.env.delete('GSUITE_SETTINGS');
    
    console.log("GSuite configuration removed successfully");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "GSuite configuration removed successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error removing GSuite configuration:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
