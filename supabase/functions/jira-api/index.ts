
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
      .replace(/\/+$/, '')         // Remove trailing slashes
      .replace(/\.atlassian\.net\.atlassian\.net$/, '.atlassian.net'); // Fix double domain suffix
    
    // Construct Jira API URL properly
    let jiraApiUrl;
    
    // Handle different API paths properly
    if (endpoint.startsWith('agile/')) {
      jiraApiUrl = `https://${cleanDomain}/rest/${endpoint}`; // agile endpoints use different path
    } else if (endpoint.startsWith('api/2/') || endpoint.startsWith('api/3/')) {
      jiraApiUrl = `https://${cleanDomain}/rest/${endpoint}`; // Handle explicitly specified api versions
    } else {
      jiraApiUrl = `https://${cleanDomain}/rest/api/3/${endpoint}`; // Default to api/3
    }
    
    // Add URL parameters if provided
    if (params) {
      const urlParams = new URLSearchParams();
      for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
          urlParams.append(key, params[key]);
        }
      }
      const queryString = urlParams.toString();
      if (queryString) {
        jiraApiUrl += `?${queryString}`;
      }
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
      
      // Special handling for common Jira error scenarios
      if (jiraResponse.status === 400 && endpoint.includes('board/') && endpoint.includes('/sprint')) {
        // Handle case where board ID might be invalid or there's a permission issue with sprints
        console.log(`Board sprint error: ${jiraApiUrl}`);
        return new Response(
          JSON.stringify({ values: [] }), // Return empty sprint array
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Special case for search endpoint with no results - return empty issues array instead of treating as error
      if (jiraResponse.status === 404 && endpoint === 'search') {
        console.log("Search returned no results, returning empty issues array");
        return new Response(
          JSON.stringify({ issues: [] }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // For non-200 responses, try to get meaningful error messages
      if (!jiraResponse.ok) {
        let errorMessage = `Jira API returned status ${jiraResponse.status}`;
        try {
          // Try to parse error as JSON
          const errorData = await jiraResponse.json();
          if (errorData.errorMessages && errorData.errorMessages.length > 0) {
            errorMessage = errorData.errorMessages.join('. ');
          } else if (errorData.errors) {
            // Join all error keys and messages
            const errorParts = [];
            for (const key in errorData.errors) {
              errorParts.push(`${key}: ${errorData.errors[key]}`);
            }
            errorMessage = errorParts.join('. ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          
          // Add more diagnostic info for 404s
          if (jiraResponse.status === 404) {
            console.error(`404 Not Found: ${jiraApiUrl}`, { errorData });
            errorMessage = `Resource not found: ${endpoint}. ${errorMessage}`;
          }
          
          // Return a more sensible response for common Jira API errors
          if (endpoint.includes('board') && (jiraResponse.status === 404 || jiraResponse.status === 403)) {
            console.log("Board not found or permission denied - returning empty results");
            return new Response(
              JSON.stringify({ values: [] }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }

          // Handle no sprints found by returning empty array (easier to handle in frontend)
          if (endpoint.includes('sprint') && (jiraResponse.status === 404 || jiraResponse.status === 403)) {
            console.log("No sprints found or permission denied - returning empty results");
            return new Response(
              JSON.stringify({ values: [] }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
        } catch (e) {
          // If we can't parse JSON, try to get text
          try {
            const errorText = await jiraResponse.text();
            if (errorText && errorText.length < 200) {
              errorMessage = errorText;
            }
          } catch (_) {
            // If that fails too, just use the status-based message
          }
        }
        
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { 
            status: jiraResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
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
