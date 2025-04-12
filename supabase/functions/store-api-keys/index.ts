
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
    const { provider, apiKey, clientSecret } = await req.json();
    
    console.log(`Received request to store API key for ${provider}`);
    
    // Validate request
    if (!provider || !apiKey) {
      console.error("Invalid request: provider or API key missing");
      return new Response(
        JSON.stringify({ error: "Provider and API key are required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Store API key in environment variable
    let envName: string;
    let secretKey: string = apiKey;
    
    switch (provider.toLowerCase()) {
      case 'openai':
        envName = 'OPENAI_API_KEY';
        break;
      case 'gsuite':
        envName = 'GSUITE_API_KEY';
        // Store client secret too if provided
        if (clientSecret) {
          try {
            Deno.env.set('GSUITE_CLIENT_SECRET', clientSecret);
            console.log("Stored GSuite client secret");
          } catch (secretErr) {
            console.error("Error storing GSuite client secret:", secretErr);
            // Continue with API key storage even if client secret fails
          }
        }
        break;
      case 'stripe':
        envName = 'STRIPE_SECRET_KEY';
        break;
      case 'twilio':
        envName = 'TWILIO_AUTH_TOKEN';
        break;
      default:
        envName = `${provider.toUpperCase()}_API_KEY`;
    }
    
    try {
      // Store the API key as environment variable
      Deno.env.set(envName, secretKey);
      console.log(`API key for ${provider} stored successfully as ${envName}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `API key for ${provider} stored successfully` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } catch (setEnvError) {
      console.error(`Error setting environment variable ${envName}:`, setEnvError);
      
      // This is a workaround for testing locally or when env variables can't be set
      // In production, this should be handled differently
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `API key for ${provider} received but couldn't be stored as an environment variable. This is likely a permissions issue in the Supabase platform.`,
          note: "This may be a temporary issue. Please check your Supabase settings or contact support if this persists."
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
  } catch (err) {
    console.error("Error storing API key:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
