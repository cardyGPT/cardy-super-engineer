
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Add request logging
  console.log(`Edge function 'validate-openai' received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ valid: false, message: 'API key is required' }),
        { 
          status: 400, 
          headers: corsHeaders 
        }
      );
    }

    // Test the API key with a minimal OpenAI API call
    const modelsResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (modelsResponse.status !== 200) {
      const error = await modelsResponse.json();
      console.error("OpenAI API key validation failed:", error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: error.error?.message || 'Invalid API key',
          status: modelsResponse.status
        }),
        { 
          status: 200, 
          headers: corsHeaders 
        }
      );
    }

    // Get billing information
    const billingResponse = await fetch('https://api.openai.com/dashboard/billing/credit_grants', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    let billingInfo = null;
    
    if (billingResponse.status === 200) {
      try {
        billingInfo = await billingResponse.json();
        console.log("OpenAI billing info:", billingInfo);
      } catch (err) {
        console.error("Error parsing billing info:", err);
      }
    } else {
      console.log("Could not fetch billing info, status:", billingResponse.status);
    }
    
    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: 'API key is valid',
        billing: billingInfo
      }),
      { 
        status: 200, 
        headers: corsHeaders 
      }
    );
  } catch (error) {
    console.error('Error in validate-openai function:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        message: error.message || 'Error validating OpenAI API key' 
      }),
      { 
        status: 500, 
        headers: corsHeaders 
      }
    );
  }
});
