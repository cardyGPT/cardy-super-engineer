
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = "https://gswwmieyrfdhrfwsgjnw.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Delete the GSuite related environment variables
    const envVarsToDelete = [
      "GSUITE_API_KEY",
      "GSUITE_DEFAULT_FOLDER",
      "GSUITE_AUTO_SYNC"
    ];
    
    // Create a payload with null values to delete the keys
    const deletePayload: Record<string, null> = {};
    envVarsToDelete.forEach(key => {
      deletePayload[key] = null;
    });
    
    // Delete the environment variables
    const secretsResponse = await fetch(
      `${supabaseUrl}/functions/v1/config/secrets`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deletePayload)
      }
    );
    
    if (!secretsResponse.ok) {
      const error = await secretsResponse.json();
      console.error("Error deleting GSuite settings:", error);
      throw new Error("Failed to delete GSuite settings");
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'GSuite configuration deleted successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in delete-gsuite-config function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Error deleting GSuite configuration' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
