
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { domain, email, apiToken, path, method = 'GET', data } = await req.json();

    // Validate required parameters
    if (!domain || !email || !apiToken || !path) {
      throw new Error('Missing required parameters: domain, email, apiToken, path');
    }

    // Create Basic auth token from email and api token
    const authToken = btoa(`${email}:${apiToken}`);

    // Ensure domain doesn't have trailing slash
    const domainWithoutTrailingSlash = domain.replace(/\/+$/, '');

    // Build Jira API url
    const apiUrl = `${domainWithoutTrailingSlash}/rest/api/3/${path.replace(/^\/+/, '')}`;

    console.log(`Making ${method} request to Jira API at: ${apiUrl}`);

    // Set up fetch options
    const fetchOptions = {
      method,
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: method !== 'GET' && data ? JSON.stringify(data) : undefined
    };

    try {
      // Call Jira API
      const response = await fetch(apiUrl, fetchOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Jira API error: ${response.status} - ${errorText}`);
        
        // Try to parse error text as JSON
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, use as is
        }
        
        // Return detailed error information
        return new Response(
          JSON.stringify({
            error: `Jira API returned status ${response.status}`,
            details: errorJson || { message: errorText },
            status: response.status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Successfully got a response
      const responseData = await response.json();
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      console.error(`Fetch error: ${fetchError.message}`);
      return new Response(
        JSON.stringify({
          error: `Failed to fetch from Jira API: ${fetchError.message}`,
          details: fetchError
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    // Log and return any errors
    console.error(`Error processing request:`, error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error occurred',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
