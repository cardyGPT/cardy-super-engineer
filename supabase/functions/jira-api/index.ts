
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
      hasCredentials: !!requestData.credentials || !!requestData.domain,
      method: requestData.method || 'GET'
    });
    
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
    
    const action = requestData.action;
    
    switch (action) {
      case 'validate':
      case 'getProjects':
      case 'get-projects':
        url = `https://${cleanDomain}/rest/api/2/project`;
        console.log(`Fetching projects from: ${url}`);
        break;
        
      case 'get-sprints':
        if (!requestData.projectId) {
          console.error("Missing projectId for getSprints action");
          return new Response(
            JSON.stringify({ error: "Project ID is required for getting sprints" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400 
            }
          );
        }
        
        // First we need to get the board ID for this project
        const boardResponse = await fetch(`https://${cleanDomain}/rest/agile/1.0/board?projectKeyOrId=${requestData.projectId}`, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!boardResponse.ok) {
          const errorData = await boardResponse.text();
          console.error(`Error fetching boards: ${boardResponse.status}`, errorData);
          return new Response(
            JSON.stringify({ error: `Failed to fetch boards: ${boardResponse.statusText}` }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: boardResponse.status 
            }
          );
        }
        
        const boardsData = await boardResponse.json();
        
        if (!boardsData.values || boardsData.values.length === 0) {
          return new Response(
            JSON.stringify({ sprints: [] }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        
        // Use the first board
        const boardId = boardsData.values[0].id;
        
        url = `https://${cleanDomain}/rest/agile/1.0/board/${boardId}/sprint`;
        console.log(`Fetching sprints from: ${url}`);
        break;
        
      case 'get-tickets':
        if (!requestData.sprintId) {
          console.error("Missing sprintId for getTickets action");
          return new Response(
            JSON.stringify({ error: "Sprint ID is required for getting tickets" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400 
            }
          );
        }
        
        const jql = `sprint=${requestData.sprintId}`;
        url = `https://${cleanDomain}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,description,status,issuetype,priority,labels,customfield_10016,assignee,created,updated,acceptanceCriteria`;
        console.log(`Fetching tickets from: ${url}`);
        break;
      
      case 'add-comment':
        if (!requestData.ticketId || !requestData.comment) {
          console.error("Missing ticketId or comment for add-comment action");
          return new Response(
            JSON.stringify({ error: "Ticket ID and comment are required" }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400 
            }
          );
        }
        
        url = `https://${cleanDomain}/rest/api/2/issue/${requestData.ticketId}/comment`;
        method = 'POST';
        body = JSON.stringify({ body: requestData.comment });
        console.log(`Adding comment to ticket: ${url}`);
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
    
    // Make the request to Jira API
    console.log(`Making ${method} request to: ${url}`);
    
    const fetchResponse = await fetch(url, {
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body
    });
    
    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error(`Jira API error: ${fetchResponse.status}`, errorText);
      
      try {
        // Try to parse as JSON for better error info
        const errorData = JSON.parse(errorText);
        return new Response(
          JSON.stringify({ 
            error: `Jira API returned ${fetchResponse.status}: ${fetchResponse.statusText}`,
            details: errorData 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: fetchResponse.status 
          }
        );
      } catch (e) {
        // Fall back to text error
        return new Response(
          JSON.stringify({ 
            error: `Jira API returned ${fetchResponse.status}: ${fetchResponse.statusText}`,
            message: errorText
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: fetchResponse.status 
          }
        );
      }
    }
    
    const responseData = await fetchResponse.json();
    let resultData = {};
    
    // Format the response based on the action
    switch (action) {
      case 'validate':
      case 'getProjects':
      case 'get-projects':
        resultData = {
          projects: responseData.map(p => ({
            id: p.id,
            key: p.key,
            name: p.name,
            avatarUrl: p.avatarUrls?.['48x48'],
            domain: cleanDomain
          }))
        };
        break;
        
      case 'get-sprints':
        resultData = {
          sprints: responseData.values.map(s => ({
            id: s.id,
            name: s.name,
            state: s.state,
            startDate: s.startDate,
            endDate: s.endDate,
            boardId: s.originBoardId
          }))
        };
        break;
        
      case 'get-tickets':
        resultData = {
          tickets: responseData.issues.map(issue => ({
            id: issue.id,
            key: issue.key,
            summary: issue.fields.summary,
            description: issue.fields.description,
            status: issue.fields.status?.name,
            issuetype: {
              id: issue.fields.issuetype?.id,
              name: issue.fields.issuetype?.name
            },
            priority: issue.fields.priority?.name,
            assignee: issue.fields.assignee?.displayName,
            labels: issue.fields.labels,
            story_points: issue.fields.customfield_10016,
            acceptance_criteria: issue.fields.acceptanceCriteria,
            created_at: issue.fields.created,
            updated_at: issue.fields.updated
          }))
        };
        break;
        
      case 'add-comment':
        resultData = {
          success: true,
          comment: responseData
        };
        break;
        
      default:
        resultData = responseData;
    }
    
    return new Response(
      JSON.stringify(resultData),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request",
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
