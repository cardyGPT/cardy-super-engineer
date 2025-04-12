
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Add request logging
  console.log(`Edge function 'jira-api' received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Parse request body
    const { endpoint, method, credentials, params, data } = await req.json();
    
    if (!credentials || !credentials.domain || !credentials.email || !credentials.apiToken) {
      console.error("Missing Jira credentials");
      return new Response(
        JSON.stringify({ error: 'Jira credentials are required' }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    if (!endpoint) {
      console.error("Missing Jira API endpoint");
      return new Response(
        JSON.stringify({ error: 'Jira API endpoint is required' }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    // Clean up domain to prevent double https:// issues
    const cleanDomain = credentials.domain
      .replace(/^https?:\/\//i, '') // Remove any existing http:// or https://
      .replace(/\/+$/, ''); // Remove trailing slashes
    
    // Construct Jira API URL properly
    let jiraApiUrl = `https://${cleanDomain}/rest/api/3/${endpoint}`;
    
    // Add URL parameters if provided
    if (params) {
      const urlParams = new URLSearchParams();
      for (const key in params) {
        urlParams.append(key, params[key]);
      }
      jiraApiUrl += `?${urlParams.toString()}`;
    }
    
    console.log(`Calling Jira API: ${method || 'GET'} ${jiraApiUrl}`);

    // Create authorization header from email and API token
    const authHeader = `Basic ${btoa(`${credentials.email}:${credentials.apiToken}`)}`;
    
    // Make request to Jira API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const jiraResponse = await fetch(jiraApiUrl, {
        method: method || 'GET',
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Log response status
      console.log(`Jira API response status: ${jiraResponse.status}`);
      
      // Get response data
      const responseData = await jiraResponse.json();
      
      // Return response with CORS headers
      return new Response(
        JSON.stringify(responseData),
        { 
          status: jiraResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Jira API request timed out');
        throw new Error('Jira API request timed out after 15 seconds');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in jira-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error calling Jira API' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
