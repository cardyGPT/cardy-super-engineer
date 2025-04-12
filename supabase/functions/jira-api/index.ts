
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Add request logging
  console.log(`Jira API function received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const requestData = await req.json();
    console.log("Request data received:", {
      action: requestData.action,
      endpoint: requestData.endpoint,
      hasCredentials: !!requestData.credentials || !!requestData.domain,
      method: requestData.method || 'GET'
    });
    
    // Handle both legacy 'action' and new 'endpoint' parameter formats
    const action = requestData.action;
    const endpoint = requestData.endpoint;
    
    // Extract credentials - handle both formats
    let domain, email, apiToken;
    
    if (requestData.credentials) {
      // New format with credentials object
      domain = requestData.credentials.domain;
      email = requestData.credentials.email;
      apiToken = requestData.credentials.apiToken || requestData.credentials.token; // Support both naming conventions
    } else {
      // Legacy format with separate parameters
      domain = requestData.domain;
      email = requestData.email;
      apiToken = requestData.apiToken;
    }
    
    // Enhanced logging
    console.log(`Processing request for domain: ${domain}`);
    console.log(`Credential check: domain=${!!domain}, email=${!!email}, apiToken=${!!apiToken}`);
    
    // Basic validation
    if (!domain || !email || !apiToken) {
      console.error("Missing Jira credentials:", { domain: !!domain, email: !!email, apiToken: !!apiToken });
      return new Response(
        JSON.stringify({ error: "Missing Jira credentials" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Clean up domain to ensure proper format
    let cleanDomain = domain.trim();
    // Remove protocol if present
    cleanDomain = cleanDomain.replace(/^https?:\/\//i, '');
    // Remove trailing slashes
    cleanDomain = cleanDomain.replace(/\/+$/, '');
    
    console.log(`Using cleaned domain: ${cleanDomain}`);
    
    // Prepare authorization header
    const authHeader = `Basic ${btoa(`${email}:${apiToken}`)}`;
    
    let response;
    let url;
    let method = requestData.method || 'GET';
    let body = null;
    
    // Handle either endpoint or legacy action pattern
    if (endpoint) {
      // New pattern: using endpoint
      url = `https://${cleanDomain}/rest/${endpoint.startsWith('agile/') ? '' : 'api/2/'}${endpoint}`;
      
      // Add query parameters if provided
      if (requestData.params) {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(requestData.params)) {
          queryParams.append(key, String(value));
        }
        url += `?${queryParams.toString()}`;
      }
      
      console.log(`Making request to: ${url} (${method})`);
      
      // Add body for POST, PUT, PATCH methods
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && requestData.data) {
        body = JSON.stringify(requestData.data);
      }
      
    } else if (action) {
      // Legacy pattern: using action
      const data = requestData.data;
      
      switch (action) {
        case 'getProjects':
          url = `https://${cleanDomain}/rest/api/2/project`;
          console.log(`Fetching projects from: ${url}`);
          break;
          
        case 'getSprints':
          if (!data?.boardId) {
            console.error("Missing boardId for getSprints action");
            return new Response(
              JSON.stringify({ error: "Board ID is required for getting sprints" }),
              { 
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400 
              }
            );
          }
          
          url = `https://${cleanDomain}/rest/agile/1.0/board/${data.boardId}/sprint`;
          console.log(`Fetching sprints from: ${url}`);
          break;
          
        case 'getTickets':
          if (!data?.jql) {
            console.error("Missing JQL for getTickets action");
            return new Response(
              JSON.stringify({ error: "JQL query is required for getting tickets" }),
              { 
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400 
              }
            );
          }
          
          url = `https://${cleanDomain}/rest/api/2/search?jql=${encodeURIComponent(data.jql)}`;
          console.log(`Fetching tickets from: ${url}`);
          break;
        
        case 'updateTicket':
          if (!data?.ticketId || !data?.content) {
            console.error("Missing ticketId or content for updateTicket action");
            return new Response(
              JSON.stringify({ error: "Ticket ID and content are required for updating a ticket" }),
              { 
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400 
              }
            );
          }
          
          url = `https://${cleanDomain}/rest/api/2/issue/${data.ticketId}/comment`;
          method = 'POST';
          body = JSON.stringify({ body: data.content });
          console.log(`Updating ticket at: ${url}`);
          break;
          
        default:
          console.error(`Invalid action requested: ${action}`);
          return new Response(
            JSON.stringify({ error: "Invalid action" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400 
            }
          );
      }
    } else {
      console.error("No endpoint or action specified");
      return new Response(
        JSON.stringify({ error: "No endpoint or action specified" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Make the API request
    response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body } : {})
    });
    
    // Detailed response logging
    console.log(`Jira API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      console.error(`Error from Jira API: ${response.status}`, errorData);
      
      return new Response(
        JSON.stringify({ 
          error: `Jira API error: ${response.status}`, 
          details: errorData,
          message: errorData.message || errorData.errorMessages?.join(', ') || 'Unknown error' 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status 
        }
      );
    }
    
    const responseData = await response.json();
    console.log(`Successful response, received ${JSON.stringify(responseData).substring(0, 100)}...`);
    
    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error in Jira API function:", err);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Unknown error occurred",
        stack: err.stack
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
