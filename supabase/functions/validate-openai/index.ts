
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
    let billingInfo = null;
    
    try {
      const billingResponse = await fetch('https://api.openai.com/dashboard/billing/credit_grants', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (billingResponse.status === 200) {
        try {
          billingInfo = await billingResponse.json();
          console.log("Retrieved OpenAI billing info successfully");
        } catch (err) {
          console.error("Error parsing billing info:", err);
        }
      } else {
        // Try alternative billing endpoint
        const usageResponse = await fetch('https://api.openai.com/dashboard/billing/usage', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
          }),
        });
        
        if (usageResponse.status === 200) {
          const usageData = await usageResponse.json();
          console.log("Retrieved OpenAI usage info:", usageData);
          
          // Construct billing info from usage data
          billingInfo = {
            total_granted: usageData.total_usage || 0,
            total_used: usageData.total_usage || 0,
            total_available: 0 // We can't determine available balance from usage data
          };
        } else {
          console.log("Could not fetch billing info, status:", billingResponse.status);
        }
      }
    } catch (err) {
      console.error("Error fetching billing info:", err);
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
