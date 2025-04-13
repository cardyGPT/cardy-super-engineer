
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const requestBody = await req.json();
    const { domain, email, apiToken, path, method = 'GET', data } = requestBody;

    // Validate all required parameters
    const missingParams = [];
    if (!domain) missingParams.push('domain');
    if (!email) missingParams.push('email');
    if (!apiToken) missingParams.push('apiToken');
    if (!path) missingParams.push('path');

    if (missingParams.length > 0) {
      console.error(`Missing required parameters: ${missingParams.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          error: 'Missing Jira credentials', 
          details: `Required parameters: ${missingParams.join(', ')}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Construct the Jira API URL - ensure proper formatting of URL
    const baseUrl = domain.includes('://') ? domain : `https://${domain}`;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const apiPath = path.startsWith('/') ? path.substring(1) : path;
    const url = `${cleanBaseUrl}/rest/api/3/${apiPath}`;
    
    console.log(`Making Jira API request to: ${url}, method: ${method}`);

    // Create auth header with base64 encoding
    const auth = btoa(`${email}:${apiToken}`);

    // Set headers
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // Special handling for board/sprint fetching
    if (apiPath.includes('agile/1.0/board') && !apiPath.includes('/sprint')) {
      console.log(`Fetching boards for project with enhanced handling`);
    }

    if (apiPath.includes('search') && (apiPath.includes('sprint') || apiPath.includes('Sprint'))) {
      console.log(`Enhanced JQL sprint search: ${apiPath}`);
    }

    // Make the request to Jira
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && data ? JSON.stringify(data) : undefined
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      
      console.error(`Jira API error (${response.status}):`, errorData);
      
      // Special handling for 404 errors on specific paths
      if (response.status === 404) {
        if (apiPath.includes('agile/1.0/board')) {
          console.log("Board not found, returning empty values array");
          return new Response(
            JSON.stringify({ values: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else if (apiPath.includes('agile/1.0/sprint')) {
          console.log("Sprint not found, returning empty values array");
          return new Response(
            JSON.stringify({ values: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }
      
      // Provide more specific error messages based on path and status code
      let errorMessage = `Jira API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 401) {
        errorMessage = "Authentication failed. Please check your Jira credentials.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to access this Jira resource.";
      } else if (response.status === 404) {
        errorMessage = "The requested Jira resource was not found.";
      } else if (apiPath.includes('agile/1.0/board')) {
        errorMessage = "Failed to fetch Jira boards. Please verify your Jira account has access to Agile boards.";
      } else if (apiPath.includes('agile/1.0/sprint')) {
        errorMessage = "Failed to fetch Jira sprints. Please verify your project is using Scrum methodology.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          statusCode: response.status,
          details: errorData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Parse the response
    const responseData = await response.json();
    
    // Log success response for debugging
    if (apiPath.includes('agile/1.0/board')) {
      console.log(`Board API response: Found ${responseData.values?.length || 0} boards`);
    } else if (apiPath.includes('agile/1.0/sprint')) {
      console.log(`Sprint API response: Found ${responseData.values?.length || 0} sprints`);
    } else if (apiPath.includes('search') && apiPath.includes('sprint')) {
      console.log(`Search API for sprints: Found ${responseData.issues?.length || 0} issues`);
    }

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in Jira API function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        stack: Deno.env.get('SUPABASE_ENV') === 'dev' ? error.stack : undefined 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
