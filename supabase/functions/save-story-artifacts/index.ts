
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { storyId, projectId, sprintId, contentType, content, contextProjectId, gsuiteId } = await req.json();

    if (!storyId) {
      return new Response(
        JSON.stringify({ error: 'Story ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!contentType || !content) {
      return new Response(
        JSON.stringify({ error: 'Content type and content are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if an artifact record already exists for this story
    const { data: existingArtifact, error: lookupError } = await supabase
      .from('story_artifacts')
      .select('*')
      .eq('story_id', storyId)
      .maybeSingle();

    if (lookupError) {
      console.error('Error looking up existing artifact:', lookupError);
      return new Response(
        JSON.stringify({ error: 'Failed to check for existing artifacts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let updateData: any = {
      story_id: storyId,
      project_id: projectId || null,
      sprint_id: sprintId || null,
      updated_at: new Date().toISOString()
    };

    // Set the content field based on the contentType
    if (contentType === 'lld') {
      updateData.lld_content = content;
      if (gsuiteId) updateData.lld_gsuite_id = gsuiteId;
    } else if (contentType === 'code') {
      updateData.code_content = content;
      if (gsuiteId) updateData.code_gsuite_id = gsuiteId;
    } else if (contentType === 'tests') {
      updateData.test_content = content;
      if (gsuiteId) updateData.test_gsuite_id = gsuiteId;
    } else if (contentType === 'test_cases') {
      updateData.test_cases_content = content;
      if (gsuiteId) updateData.test_cases_gsuite_id = gsuiteId;
    }

    let result;

    if (existingArtifact) {
      // Update existing record
      const { data, error } = await supabase
        .from('story_artifacts')
        .update(updateData)
        .eq('id', existingArtifact.id)
        .select();

      if (error) {
        console.error('Error updating artifact:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update artifact' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      result = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('story_artifacts')
        .insert(updateData)
        .select();

      if (error) {
        console.error('Error creating artifact:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create artifact' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      result = data;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-story-artifacts function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
