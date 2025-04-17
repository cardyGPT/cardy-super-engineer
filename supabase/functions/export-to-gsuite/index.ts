
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to export to GSuite");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the GSuite credentials from the database
    const { data: gsuiteCreds, error: credsError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('service', 'gsuite')
      .maybeSingle();
      
    if (credsError) {
      console.error("Error fetching GSuite credentials:", credsError);
      throw new Error("Failed to fetch GSuite credentials");
    }
    
    if (!gsuiteCreds) {
      throw new Error('Google API credentials are not configured');
    }
    
    const googleApiKey = gsuiteCreds.api_key;
    const clientId = gsuiteCreds.client_id;
    const clientSecret = gsuiteCreds.client_secret;
    
    if (!googleApiKey && (!clientId || !clientSecret)) {
      throw new Error('No valid Google API credentials found');
    }

    const { documentName, content, artifactType, storyId } = await req.json();
    
    if (!documentName || !content) {
      throw new Error('Document name and content are required');
    }

    // Validate and format the content for Google Docs
    const formattedContent = formatContentForDocs(content, artifactType);
    
    // Create a new Google Docs document using the appropriate credential
    const document = await createGoogleDoc(documentName, formattedContent, googleApiKey, clientId, clientSecret);
    
    // Update the story artifact with the Google Doc ID for reference
    if (storyId) {
      try {
        await updateStoryArtifact(supabase, storyId, artifactType, document.id);
      } catch (error) {
        console.error("Error updating story artifact:", error);
        // Continue execution even if this fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId: document.id,
        documentUrl: `https://docs.google.com/document/d/${document.id}/edit`,
        message: "Document created successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in export-to-gsuite function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to export document to Google Docs"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

async function createGoogleDoc(title, content, apiKey, clientId, clientSecret) {
  try {
    // Determine which credential to use
    const authHeader = apiKey 
      ? `Bearer ${apiKey}` 
      : `Bearer ${await getAccessToken(clientId, clientSecret)}`;
    
    // Create a new Google Doc
    const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Failed to create Google Doc: ${error.error?.message || error.error || 'Unknown error'}`);
    }

    const doc = await createResponse.json();
    console.log("Created Google Doc:", doc.documentId);

    // Insert content into the document
    const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: content
            }
          }
        ]
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      throw new Error(`Failed to update Google Doc: ${error.error?.message || error.error || 'Unknown error'}`);
    }

    return doc;
  } catch (error) {
    console.error("Error creating Google Doc:", error);
    throw error;
  }
}

// Helper function to get access token when using client ID/secret
async function getAccessToken(clientId, clientSecret) {
  // This is a simplified implementation.
  // In a real-world scenario, you would implement OAuth2 flow or use a token exchange
  throw new Error("OAuth2 token exchange not implemented yet. Please use API key instead.");
}

function formatContentForDocs(content, artifactType) {
  // Format content based on artifact type
  let formattedContent = content;
  
  // Add headers based on type
  if (artifactType === 'lld') {
    formattedContent = `# Low-Level Design Document\n\n${formattedContent}`;
  } else if (artifactType === 'code') {
    formattedContent = `# Code Implementation\n\n${formattedContent}`;
  } else if (artifactType === 'tests') {
    formattedContent = `# Test Cases\n\n${formattedContent}`;
  }
  
  return formattedContent;
}

async function updateStoryArtifact(supabase, storyId, artifactType, docId) {
  // Map artifact type to column name
  const columnMap = {
    'lld': 'lld_gsuite_id',
    'code': 'code_gsuite_id',
    'tests': 'test_gsuite_id'
  };
  
  const column = columnMap[artifactType];
  if (!column) return;
  
  // First, check if there's already a record for this story
  const { data: existingData, error: findError } = await supabase
    .from('story_artifacts')
    .select('id')
    .eq('story_id', storyId)
    .maybeSingle();
    
  if (findError) {
    console.error(`Error checking for existing record for story ${storyId}:`, findError);
    throw findError;
  }
  
  let updateError;
  
  if (existingData?.id) {
    // If a record exists, update it
    console.log(`Updating existing record for story ${storyId} with Google Doc ID`);
    const { error } = await supabase
      .from('story_artifacts')
      .update({ [column]: docId })
      .eq('id', existingData.id);
      
    updateError = error;
  } else {
    // If no record exists, insert a new one
    console.log(`Creating new record for story ${storyId} with Google Doc ID`);
    const { error } = await supabase
      .from('story_artifacts')
      .insert({ 
        story_id: storyId,
        [column]: docId 
      });
      
    updateError = error;
  }
  
  if (updateError) {
    console.error(`Error updating story artifact ${storyId} with Google Doc ID:`, updateError);
    throw updateError;
  }
}
