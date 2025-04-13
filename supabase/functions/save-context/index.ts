
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

    const { projectId, documentIds } = await req.json();

    // If no projectId is provided, clear any existing context settings
    if (!projectId) {
      const { error } = await supabase
        .from('project_context')
        .delete()
        .not('id', 'is', null);
      
      if (error) {
        console.error('Error clearing context:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to clear context settings' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Context cleared' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that the project exists
    const { data: projectExists, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .maybeSingle();
    
    if (projectError || !projectExists) {
      console.error('Project validation error:', projectError);
      return new Response(
        JSON.stringify({ error: 'Invalid project ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate document IDs if any are provided
    if (documentIds && documentIds.length > 0) {
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('id')
        .in('id', documentIds);
      
      if (docsError) {
        console.error('Document validation error:', docsError);
        return new Response(
          JSON.stringify({ error: 'Error validating document IDs' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Check if all requested document IDs exist
      const foundDocIds = docsData.map(d => d.id);
      const missingDocIds = documentIds.filter(id => !foundDocIds.includes(id));
      
      if (missingDocIds.length > 0) {
        return new Response(
          JSON.stringify({ error: 'One or more document IDs are invalid' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Clear any existing context settings first
    await supabase
      .from('project_context')
      .delete()
      .not('id', 'is', null);

    // Save the new context settings
    const { data, error } = await supabase
      .from('project_context')
      .insert({
        project_id: projectId,
        document_ids: documentIds || [],
        created_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error saving context:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save context settings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-context function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
