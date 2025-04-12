
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
    const { action, domain, email, apiToken, data } = await req.json();
    
    // Enhanced logging
    console.log(`Processing ${action} request for domain: ${domain}`);
    
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
    
    switch (action) {
      case 'getProjects':
        url = `https://${cleanDomain}/rest/api/2/project`;
        console.log(`Fetching projects from: ${url}`);
        
        response = await fetch(url, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        });
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
        
        response = await fetch(url, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        });
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
        
        response = await fetch(url, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        });
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
        console.log(`Updating ticket at: ${url}`);
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            body: data.content
          })
        });
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
    console.log(`Successful response for ${action}, received ${JSON.stringify(responseData).substring(0, 100)}...`);
    
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
