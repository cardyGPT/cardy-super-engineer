
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

// Helper function to safely convert any content to string
const safeStringify = (content: any): string => {
  if (content === null || content === undefined) {
    return "";
  }
  
  if (typeof content === 'string') {
    return content;
  }
  
  // Handle Jira document format or any object
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch (e) {
      console.error("Error stringifying content:", e);
      return "[Content conversion error]";
    }
  }
  
  return String(content);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    // Parse request body
    const { jiraTicket, dataModel, documentsContext, request, projectContext, selectedDocuments, additionalContext, type } = await req.json();
    
    if (!jiraTicket) {
      return new Response(
        JSON.stringify({ error: 'Jira ticket information is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare context for the model
    let ticketContext = `
Jira Ticket: ${jiraTicket.key || 'Unknown'}
Summary: ${safeStringify(jiraTicket.summary) || 'No summary provided'}
Description: ${safeStringify(jiraTicket.description) || 'No description provided'}
Status: ${safeStringify(jiraTicket.status) || 'Unknown'}
Priority: ${safeStringify(jiraTicket.priority) || 'Unknown'}
Type: ${safeStringify(jiraTicket.issuetype?.name) || 'Unknown'}
`;

    if (jiraTicket.acceptance_criteria) {
      ticketContext += `\nAcceptance Criteria: ${safeStringify(jiraTicket.acceptance_criteria)}`;
    }

    // Add any additional contexts
    if (dataModel) {
      ticketContext += `\nData Model Context:\n${safeStringify(dataModel)}`;
    }

    if (documentsContext) {
      ticketContext += `\nDocuments Context:\n${safeStringify(documentsContext)}`;
    }

    // Include sprint and epic information if available
    if (additionalContext?.sprint) {
      ticketContext += `\nSprint Information:\n${safeStringify(additionalContext.sprint)}`;
    }
    
    if (additionalContext?.epic) {
      ticketContext += `\nEpic Information:\n${safeStringify(additionalContext.epic)}`;
    }
    
    // Add previously generated content as context
    if (additionalContext?.lldContent && (type === 'code' || type === 'tests' || type === 'testcases' || type === 'testScripts')) {
      ticketContext += `\n\nPreviously Generated LLD:\n${safeStringify(additionalContext.lldContent)}`;
    }
    
    if (additionalContext?.codeContent && (type === 'tests' || type === 'testcases' || type === 'testScripts')) {
      ticketContext += `\n\nPreviously Generated Code:\n${safeStringify(additionalContext.codeContent)}`;
    }
    
    if (additionalContext?.testContent && (type === 'testcases' || type === 'testScripts')) {
      ticketContext += `\n\nPreviously Generated Unit Tests:\n${safeStringify(additionalContext.testContent)}`;
    }
    
    if (additionalContext?.testCasesContent && type === 'testScripts') {
      ticketContext += `\n\nPreviously Generated Test Cases:\n${safeStringify(additionalContext.testCasesContent)}`;
    }

    // If there's a custom prompt from the user, include it
    if (additionalContext?.customPrompt) {
      ticketContext += `\n\nUser's Custom Instructions:\n${safeStringify(additionalContext.customPrompt)}`;
    }

    // If there's current content to refine, include it
    if (additionalContext?.currentContent) {
      ticketContext += `\n\nCurrent Content to Refine:\n${safeStringify(additionalContext.currentContent)}`;
    }

    // If projectContext is provided, fetch the project and documents info
    if (projectContext) {
      try {
        // Get project info
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, name, type')
          .eq('id', projectContext)
          .single();
        
        if (projectError) throw projectError;
        
        ticketContext += `\nProject Context:\nProject: ${projectData.name} (${projectData.type})`;
        
        // Get document info if selectedDocuments is provided
        if (selectedDocuments && selectedDocuments.length > 0) {
          const { data: documentsData, error: documentsError } = await supabase
            .from('documents')
            .select('id, name, type')
            .in('id', selectedDocuments);
          
          if (documentsError) throw documentsError;
          
          if (documentsData && documentsData.length > 0) {
            ticketContext += `\n\nReference Documents:`;
            documentsData.forEach(doc => {
              ticketContext += `\n- ${doc.name} (${doc.type})`;
            });
          }
        }
      } catch (contextError) {
        console.error("Error fetching context:", contextError);
        // Continue even if context fetch fails
      }
    }

    // Create the system prompt based on the content type
    let systemPrompt = "";
    
    if (type === 'lld') {
      systemPrompt = `You are an expert software architect who creates detailed low-level design documents.
Based on the Jira ticket information, create a comprehensive low-level design document.
Include component breakdowns, data models, API endpoints, sequence diagrams, error handling, and security considerations.
Format everything properly in markdown with clear headings, code blocks, and diagrams.
Your response should be detailed, structured, and directly usable in a technical documentation system.

Format your response with these sections:
1. Overview
2. Component Breakdown
3. Data Models
4. API Endpoints
5. Sequence Diagrams
6. Error Handling
7. Security Considerations
8. Implementation Notes`;
    } 
    else if (type === 'code') {
      systemPrompt = `You are an expert software developer specializing in AngularJS (frontend), NodeJS (backend), and PostgreSQL.
Based on the Jira ticket information and the Low-Level Design document provided, create implementation code that addresses the requirements.
Include all necessary components, services, and utility functions.
Structure your code following best practices, with clear comments and error handling.
Format everything properly in markdown with appropriate syntax highlighting.
Your code should be complete, well-structured, and ready for review.

Format your response with these sections:
1. Implementation Overview
2. Component Code
3. Service Code
4. Utility Functions
5. Database Queries
6. Integration Points`;
    } 
    else if (type === 'tests') {
      systemPrompt = `You are an expert in software testing with experience in writing unit tests.
Based on the Jira ticket information, previously generated Low-Level Design, and implementation code, create comprehensive unit tests.
Use Jest for backend testing and Jasmine for frontend testing.
Include setup, mocking, edge cases, and coverage considerations.
Format everything properly in markdown with clear test scenarios and expected results.
Your tests should be thorough, covering all aspects of the functionality described in the implementation.

Format your response with these sections:
1. Testing Strategy
2. Backend Tests (Jest)
3. Frontend Tests (Jasmine)
4. Edge Cases
5. Mocks and Test Doubles
6. Test Coverage Analysis`;
    } 
    else if (type === 'testcases') {
      systemPrompt = `You are an expert in software testing with experience in quality assurance and test case design.
Based on the Jira ticket information, Low-Level Design document, and other available context, create a comprehensive set of test cases that could be executed manually.
Include positive tests, negative tests, edge cases, and user experience tests.
Format everything properly in markdown with clear test steps, expected results, and preconditions.
Your test cases should be thorough, covering all aspects of the functionality described in the ticket.

Format your response with these sections:
1. Test Strategy
2. Positive Test Cases
3. Negative Test Cases
4. Edge Cases
5. User Experience Test Cases
6. Traceability Matrix`;
    }
    else if (type === 'testScripts') {
      systemPrompt = `You are an expert in test automation and performance testing.
Based on the Jira ticket information, implementation code, unit tests, and test cases, create comprehensive test scripts.
Part 1: Create functional test scripts using Playwright for automated end-to-end testing.
Part 2: Create performance test scripts using JMeter for load and performance testing.
Format everything properly in markdown with clear code blocks and comments.
Your scripts should be ready to run with minimal modification.

Format your response with these sections:
1. Testing Approach Overview
2. Functional Test Scripts (Playwright)
   - Test Setup
   - Page Objects
   - Test Scenarios
   - Assertions
3. Performance Test Scripts (JMeter)
   - Test Plan
   - Thread Groups
   - Samplers
   - Assertions
   - Reporting Configuration
4. Integration with CI/CD
5. Notes and Considerations`;
    }
    else {
      systemPrompt = `You are an expert software development assistant.
Analyze the Jira ticket information and provide a comprehensive response addressing the requirements.
Format your response cleanly and professionally in markdown.
Your response should be detailed, structured and directly usable by the development team.`;
    }

    // If there's a custom prompt, adjust the system prompt to focus on refinement
    if (additionalContext?.customPrompt && additionalContext?.currentContent) {
      systemPrompt += `\n\nYou are being asked to refine some previously generated content according to specific user instructions. 
Focus on addressing the user's feedback while maintaining the quality and structure of the existing content.
Don't repeat everything if only specific parts need changes - be precise with your improvements.`;
    }

    // Call OpenAI API
    try {
      console.log(`Generating ${type} content for ticket ${jiraTicket.key}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `${ticketContext}\n\nPlease generate a detailed, well-formatted ${
                type === 'lld' ? 'low-level design document' : 
                type === 'code' ? 'implementation code' : 
                type === 'tests' ? 'unit tests (Jest for backend, Jasmine for frontend)' : 
                type === 'testcases' ? 'manual test cases' : 
                type === 'testScripts' ? 'test scripts (Playwright for functional, JMeter for performance)' : 
                'response'
              } based on this Jira ticket information.${
                type !== 'lld' ? ' Make sure to utilize the previously generated artifacts in your response.' : ''
              }${
                additionalContext?.customPrompt ? ' Please follow the custom instructions carefully.' : ''
              }\n\nEnsure your response is well-structured with clear headings, proper code formatting, and follows the requested format structure.`
            }
          ],
          temperature: 0.5,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const responseContent = data.choices[0].message.content;
      
      // Save the content to the database if ticket key is provided
      try {
        if (jiraTicket.key) {
          console.log(`Saving ${type} content for ticket ${jiraTicket.key}`);
          
          const { data: existingData, error: checkError } = await supabase
            .from('ticket_artifacts')
            .select('*')
            .eq('story_id', jiraTicket.key)
            .maybeSingle();
          
          let updateData: Record<string, any> = {
            story_id: jiraTicket.key,
            project_id: jiraTicket.projectId || null,
            sprint_id: jiraTicket.sprintId || null,
          };
          
          // Set the content based on type
          if (type === 'lld') {
            updateData.lld_content = responseContent;
          } else if (type === 'code') {
            updateData.code_content = responseContent;
          } else if (type === 'tests') {
            updateData.test_content = responseContent;
          } else if (type === 'testcases') {
            updateData.testcases_content = responseContent;
          } else if (type === 'testScripts') {
            updateData.testscripts_content = responseContent;
          }
          
          if (existingData) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('ticket_artifacts')
              .update(updateData)
              .eq('id', existingData.id);
              
            if (updateError) {
              console.error("Error updating story artifact:", updateError);
            }
          } else {
            // Insert new record
            const { error: insertError } = await supabase
              .from('ticket_artifacts')
              .insert(updateData);
              
            if (insertError) {
              console.error("Error inserting story artifact:", insertError);
            }
          }
        }
      } catch (saveError) {
        console.error("Error saving generated content:", saveError);
        // Continue even if saving fails
      }

      // Return the generated content
      return new Response(
        JSON.stringify({ response: responseContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (openAIError) {
      console.error("Error calling OpenAI API:", openAIError);
      throw new Error(`Failed to generate content: ${openAIError.message}`);
    }
  } catch (error) {
    console.error("Error in chat-with-jira function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred processing the request",
        response: "Error occurred while generating content. Please try again." 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
