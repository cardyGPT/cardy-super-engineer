
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
    const { defaultDriveFolder, autoSync } = await req.json();
    
    // Store settings as environment variables
    const envVars: Record<string, string> = {};
    
    if (defaultDriveFolder !== undefined) {
      envVars.GSUITE_DEFAULT_FOLDER = defaultDriveFolder;
    }
    
    if (autoSync !== undefined) {
      envVars.GSUITE_AUTO_SYNC = autoSync.toString();
    }
    
    // Set the environment variables
    const secretsResponse = await fetch(
      `${supabaseUrl}/functions/v1/config/secrets`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envVars)
      }
    );
    
    if (!secretsResponse.ok) {
      const error = await secretsResponse.json();
      console.error("Error saving GSuite settings:", error);
      throw new Error("Failed to save GSuite settings");
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'GSuite settings saved successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in save-gsuite-settings function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Error saving GSuite settings' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
