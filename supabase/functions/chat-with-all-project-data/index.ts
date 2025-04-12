
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import OpenAI from "https://esm.sh/openai@4.0.0";

// Initialize OpenAI client with API key from environment variable
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documents, messages } = await req.json();
    
    console.log("Processing chat request with all project data");
    console.log(`Number of documents: ${documents?.length || 0}`);
    console.log(`Messages: ${JSON.stringify(messages)}`);
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Format documents for the API
    const formattedDocuments = documents?.map((doc: any) => {
      let content = "";
      
      if (typeof doc.content === "string") {
        content = doc.content;
      } else if (doc.content) {
        content = JSON.stringify(doc.content, null, 2);
      }
      
      return {
        type: "document",
        document: {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          content: content
        }
      };
    }) || [];
    
    // Prepare system message with access to all project data
    const systemMessage = {
      role: "system",
      content: `You are Cardy Mind, an AI assistant with access to all project documents and data models. 
      You help users analyze their documents and data models, answer questions, and provide insights.
      Your responses should be clear, informative, and helpful.
      When referencing specific documents or data models, mention them by name.
      You have complete access to read and analyze all project documents and database structures.
      
      If you encounter JSON data, process it carefully and extract meaningful information from it.
      For data models, you can analyze the entities, relationships, and attributes.
      Be thorough in your analysis of documents and try to provide helpful insights.`
    };
    
    // Call OpenAI API with the documents included
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
      temperature: 0.5,
      max_tokens: 2500,
      tools: [
        {
          type: "retrieval"
        }
      ],
      tool_choice: "auto",
      tool_resources: {
        retrieval: {
          context: formattedDocuments
        }
      }
    });
    
    console.log("OpenAI response received");
    
    return new Response(
      JSON.stringify({ response: response.choices[0].message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
