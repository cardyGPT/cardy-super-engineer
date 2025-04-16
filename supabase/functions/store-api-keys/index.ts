
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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
    
    // Store credentials in environment variables
    const credentials = [];
    
    if (apiKey) {
      try {
        const apiKeyEnvName = `${provider.toUpperCase()}_API_KEY`;
        Deno.env.set(apiKeyEnvName, apiKey);
        console.log(`Stored ${provider} API key as ${apiKeyEnvName}`);
        credentials.push('API key');
      } catch (apiKeyErr) {
        console.error(`Error storing ${provider} API key:`, apiKeyErr);
      }
    }
    
    if (clientId) {
      try {
        const clientIdEnvName = `${provider.toUpperCase()}_CLIENT_ID`;
        Deno.env.set(clientIdEnvName, clientId);
        console.log(`Stored ${provider} client ID as ${clientIdEnvName}`);
        credentials.push('Client ID');
      } catch (clientIdErr) {
        console.error(`Error storing ${provider} client ID:`, clientIdErr);
      }
    }
    
    if (clientSecret) {
      try {
        const clientSecretEnvName = `${provider.toUpperCase()}_CLIENT_SECRET`;
        Deno.env.set(clientSecretEnvName, clientSecret);
        console.log(`Stored ${provider} client secret as ${clientSecretEnvName}`);
        credentials.push('Client Secret');
      } catch (clientSecretErr) {
        console.error(`Error storing ${provider} client secret:`, clientSecretErr);
      }
    }
    
    if (credentials.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Failed to store any credentials. This is likely a permissions issue in the Supabase platform." 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
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
