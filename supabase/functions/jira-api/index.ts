
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { action, domain, email, apiToken, data } = await req.json();
    
    // Basic validation
    if (!domain || !email || !apiToken) {
      return new Response(
        JSON.stringify({ error: "Missing Jira credentials" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Prepare authorization header
    const authHeader = `Basic ${btoa(`${email}:${apiToken}`)}`;
    
    let response;
    
    switch (action) {
      case 'getProjects':
        response = await fetch(`https://${domain}/rest/api/2/project`, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        });
        break;
        
      case 'getSprints':
        if (!data.boardId) {
          return new Response(
            JSON.stringify({ error: "Board ID is required for getting sprints" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400 
            }
          );
        }
        
        response = await fetch(`https://${domain}/rest/agile/1.0/board/${data.boardId}/sprint`, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        });
        break;
        
      case 'getTickets':
        if (!data.jql) {
          return new Response(
            JSON.stringify({ error: "JQL query is required for getting tickets" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400 
            }
          );
        }
        
        response = await fetch(`https://${domain}/rest/api/2/search?jql=${encodeURIComponent(data.jql)}`, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        });
        break;
      
      case 'updateTicket':
        if (!data.ticketId || !data.content) {
          return new Response(
            JSON.stringify({ error: "Ticket ID and content are required for updating a ticket" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400 
            }
          );
        }
        
        // Update ticket with content (adding as a comment)
        response = await fetch(`https://${domain}/rest/api/2/issue/${data.ticketId}/comment`, {
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
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error from Jira API: ${response.status}`, errorData);
      
      return new Response(
        JSON.stringify({ 
          error: `Jira API error: ${response.status}`, 
          details: errorData 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status 
        }
      );
    }
    
    const responseData = await response.json();
    
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
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
