
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
    
    // Get the OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Parse request body
    const { jiraTicket, dataModel, documentsContext, request, projectContext, selectedDocuments, additionalContext } = await req.json();
    
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
Assignee: ${safeStringify(jiraTicket.assignee?.displayName) || 'Unassigned'}
Reporter: ${safeStringify(jiraTicket.reporter?.displayName) || 'Unknown'}
`;

    // Add acceptance criteria if available
    if (jiraTicket.acceptance_criteria) {
      ticketContext += `\nAcceptance Criteria:\n${safeStringify(jiraTicket.acceptance_criteria)}`;
    }

    // Add story points if available
    if (jiraTicket.story_points) {
      ticketContext += `\nStory Points: ${safeStringify(jiraTicket.story_points)}`;
    }

    // Add labels if available
    if (jiraTicket.labels && jiraTicket.labels.length > 0) {
      ticketContext += `\nLabels: ${safeStringify(jiraTicket.labels.join(', '))}`;
    }

    // Add created and updated dates if available
    if (jiraTicket.created_at) {
      ticketContext += `\nCreated: ${safeStringify(jiraTicket.created_at)}`;
    }
    
    if (jiraTicket.updated_at) {
      ticketContext += `\nUpdated: ${safeStringify(jiraTicket.updated_at)}`;
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

    // Add framework information if provided
    if (additionalContext?.framework) {
      ticketContext += `\nFramework: ${safeStringify(additionalContext.framework)}`;
    }
    
    if (additionalContext?.backend) {
      ticketContext += `\nBackend: ${safeStringify(additionalContext.backend)}`;
    }
    
    if (additionalContext?.database) {
      ticketContext += `\nDatabase: ${safeStringify(additionalContext.database)}`;
    }
    
    if (additionalContext?.testingFramework) {
      ticketContext += `\nTesting Framework: ${safeStringify(additionalContext.testingFramework)}`;
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

    // Determine generation type from the request
    let contentType = 'general';
    let systemPrompt = '';
    
    if (request) {
      const requestLower = request.toLowerCase();
      if (requestLower.includes('low-level design') || requestLower.includes('lld')) {
        contentType = 'lld';
        systemPrompt = `You are an expert software architect. Based on the provided Jira ticket information, create a detailed low-level design document that follows these guidelines:

1. Start with a comprehensive overview of the feature or component being designed.
2. Include detailed component diagrams showing the relationships between different parts of the system.
3. Specify API contracts with clear endpoint definitions, request/response formats, and error handling.
4. Document data flow between components, including sequence diagrams where appropriate.
5. Define database schema changes if required, with entity relationships and field specifications.
6. List technical constraints, assumptions, and dependencies.
7. Highlight potential performance considerations and optimization strategies.
8. Include security considerations where applicable.

The LLD should be well-structured with clear headings, code examples where appropriate, and should follow best practices for Angular (frontend), Node.js (backend), and PostgreSQL (database) architecture.

Remember to specifically address the requirements and acceptance criteria mentioned in the ticket.

Format your response using Markdown for easy readability.`;
      } else if (requestLower.includes('code') || requestLower.includes('implementation')) {
        contentType = 'code';
        systemPrompt = `You are an expert software developer. Based on the provided Jira ticket and any contextual information, generate the necessary code implementation that adheres to these guidelines:

1. Write clean, maintainable code following industry best practices.
2. Use Angular for frontend components, with appropriate TypeScript typing and component structure.
3. Implement Node.js for backend services, with proper error handling and API structuring.
4. Include PostgreSQL queries where database interactions are required.
5. Add comprehensive inline documentation explaining complex logic.
6. Follow a modular approach with clear separation of concerns.
7. Include proper error handling and edge case consideration.
8. Ensure the code is efficient and performant.

Focus on producing production-ready code that specifically addresses the requirements and acceptance criteria in the ticket.

Use Markdown code blocks with appropriate language syntax highlighting for each file or component. Include file names as comments or headings.`;
      } else if (requestLower.includes('test case') || requestLower.includes('qa')) {
        contentType = 'test_cases';
        systemPrompt = `You are an expert QA engineer. Based on the provided Jira ticket, create comprehensive test cases to validate the feature. Your test cases should follow these guidelines:

1. Organize test cases by functional areas or user flows.
2. Include detailed preconditions, steps, and expected results for each test case.
3. Cover positive test scenarios that validate correct functionality.
4. Include negative test scenarios to verify proper error handling.
5. Add edge cases and boundary conditions.
6. Consider performance, security, and usability testing where applicable.
7. Ensure test cases are clearly written and easy to follow.
8. Include traceability to requirements or acceptance criteria.

Make sure your test cases specifically verify that all the acceptance criteria in the ticket are met.

Format your response using Markdown with clear sections for different test categories. Use tables for structured test cases with columns for ID, Description, Steps, and Expected Results.`;
      } else if (requestLower.includes('tests') || requestLower.includes('playwright')) {
        contentType = 'tests';
        systemPrompt = `You are an expert test automation engineer. Based on the provided Jira ticket, create comprehensive Playwright test scripts that follow these guidelines:

1. Use TypeScript for all Playwright test scripts.
2. Structure tests following the Page Object Model pattern when appropriate.
3. Include setup and teardown procedures for test initialization and cleanup.
4. Write tests that cover critical user journeys and edge cases.
5. Implement proper assertions to validate expected behavior.
6. Add descriptive comments explaining the purpose of each test.
7. Group related tests together in test suites.
8. Consider test data management strategies.
9. Include error handling and reporting mechanisms.

Make sure your tests specifically verify that all the acceptance criteria in the ticket are met.

Code should be production-ready, following best practices for Playwright test automation.
Use Markdown code blocks with TypeScript syntax highlighting. Include file names as comments or headings.`;
      } else if (requestLower.includes('all')) {
        contentType = 'all';
        // For 'all' we'll use a general system prompt and handle specific prompts downstream
        systemPrompt = `You are an expert software engineer with deep knowledge of software architecture, development, and testing. Based on the provided Jira ticket information, please provide a comprehensive analysis and implementation plan that addresses all aspects of the feature, including:

1. A detailed low-level design
2. Implementation code for Angular frontend and Node.js backend with PostgreSQL database
3. Test cases and Playwright test scripts

Your response should be thorough yet focused on the specific requirements and acceptance criteria of the ticket. Structure your response clearly with distinct sections for each component (design, code, testing).`;
      }
    }

    // If no specific system prompt is set, use a default based on content type
    if (!systemPrompt) {
      switch (contentType) {
        case 'lld':
          systemPrompt = `You are an expert software architect. Create a detailed low-level design document for Angular and Node.js with PostgreSQL based on the provided Jira ticket.
          Include component diagrams, data flow, API contracts, and database schema changes if applicable.
          Address all requirements and acceptance criteria in the ticket.
          Format your response using Markdown for easy readability.`;
          break;
        
        case 'code':
          systemPrompt = `You are an expert software developer. Based on the provided Jira ticket, generate the necessary code implementation.
          Include all relevant files, classes, methods, and functions that would be needed for Angular, Node.js and PostgreSQL.
          Focus on producing clean, maintainable, and well-documented code that addresses all requirements and acceptance criteria.
          Use Markdown code blocks with appropriate language syntax highlighting and include file names.`;
          break;
        
        case 'test_cases':
          systemPrompt = `You are an expert QA engineer. Based on the provided Jira ticket, create comprehensive test cases to validate the feature.
          Include both positive and negative scenarios, edge cases, and performance considerations.
          Make sure all acceptance criteria are covered by your test cases.
          Format your response using Markdown, with clear sections for different test categories and tables for structured test cases.`;
          break;
        
        case 'tests':
          systemPrompt = `You are an expert automation engineer. Based on the provided Jira ticket, create comprehensive Playwright test scripts in TypeScript.
          Include setup, teardown, assertions, and error handling. Structure tests following the Page Object Model pattern.
          Ensure all acceptance criteria are verified by your tests.
          Format your response using Markdown code blocks with TypeScript syntax highlighting and include file names.`;
          break;
        
        default:
          systemPrompt = `You are a helpful assistant for software development teams. Provide a detailed and comprehensive response to the user's request about the Jira ticket.`;
      }
    }

    // Add specific technology stack information to the system prompt
    const techStackPrompt = `\n\nTechnology Stack Information:
- Frontend: Angular with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL
- Testing: Playwright for automation testing

Make sure your response is tailored to work with this specific technology stack.`;

    systemPrompt += techStackPrompt;

    // Call the OpenAI API
    console.log(`Calling OpenAI API for ${contentType} generation...`);
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
            content: `${request || `Generate ${contentType} for the following Jira ticket`}:\n\n${ticketContext}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Error calling OpenAI API");
    }
    
    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Return the generated content
    return new Response(
      JSON.stringify({ response: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
