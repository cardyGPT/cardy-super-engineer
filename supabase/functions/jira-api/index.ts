
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { domain, email, apiToken, path, method = 'GET', data } = await req.json();

    if (!domain || !email || !apiToken) {
      return new Response(
        JSON.stringify({ error: 'Missing Jira credentials' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Missing API path' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Construct the Jira API URL
    const baseUrl = domain.endsWith('/') ? domain : `${domain}/`;
    const apiPath = path.startsWith('/') ? path.substring(1) : path;
    const url = `${baseUrl}rest/api/3/${apiPath}`;

    // Create auth header with base64 encoding
    const auth = btoa(`${email}:${apiToken}`);

    // Set headers
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // Make the request to Jira
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && data ? JSON.stringify(data) : undefined
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Jira API error (${response.status}):`, errorData);
      return new Response(
        JSON.stringify({ 
          error: `Jira API error: ${response.status} ${response.statusText}`,
          details: errorData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Parse the response
    const responseData = await response.json();

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in Jira API function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
