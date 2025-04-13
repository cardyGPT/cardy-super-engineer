
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  // Add request logging
  console.log(`Edge function 'save-story-artifacts' received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Validate Supabase configuration
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration is missing");
      return new Response(
        JSON.stringify({ error: 'Supabase configuration is not complete' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    console.log("Request data received:", {
      hasStoryId: !!requestBody.storyId,
      hasContentType: !!requestBody.contentType,
      contentLength: requestBody.content?.length || 0,
    });

    // Extract data from request
    const { storyId, projectId, sprintId, contentType, content } = requestBody;
    
    if (!storyId || !contentType || !content) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: 'Story ID, content type, and content are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate content type
    if (!['lld', 'code', 'tests'].includes(contentType)) {
      console.error("Invalid content type:", contentType);
      return new Response(
        JSON.stringify({ error: 'Content type must be one of: lld, code, tests' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client initialized");

    // Prepare data for upsert
    const contentField = `${contentType}_content`;
    const data: any = {
      story_id: storyId,
      updated_at: new Date().toISOString()
    };
    
    data[contentField] = content;
    
    if (projectId) data.project_id = projectId;
    if (sprintId) data.sprint_id = sprintId;

    console.log(`Upserting ${contentType} content for story ${storyId}`);

    // First, check if there's already a record for this story
    const { data: existingData, error: findError } = await supabase
      .from('story_artifacts')
      .select('id')
      .eq('story_id', storyId)
      .maybeSingle();
      
    if (findError) {
      console.error("Error checking for existing record:", findError);
      return new Response(
        JSON.stringify({ error: `Failed to check for existing record: ${findError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    let result;
    
    if (existingData?.id) {
      // If a record exists, update it
      console.log(`Updating existing record for story ${storyId}`);
      result = await supabase
        .from('story_artifacts')
        .update(data)
        .eq('id', existingData.id)
        .select();
    } else {
      // If no record exists, insert a new one
      console.log(`Creating new record for story ${storyId}`);
      result = await supabase
        .from('story_artifacts')
        .insert(data)
        .select();
    }
    
    const { data: savedData, error } = result;

    if (error) {
      console.error("Error saving to database:", error);
      return new Response(
        JSON.stringify({ error: `Failed to save ${contentType} content: ${error.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Successfully saved ${contentType} content for story ${storyId}`);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${contentType.toUpperCase()} content saved successfully`,
        data: savedData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in save-story-artifacts function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
