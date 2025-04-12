
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
          Deno.env.set('GSUITE_CLIENT_SECRET', clientSecret);
          console.log("Stored GSuite client secret");
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
