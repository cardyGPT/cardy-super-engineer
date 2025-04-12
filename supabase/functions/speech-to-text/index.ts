
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Helper function to process base64 audio data in chunks
function processBase64AudioData(base64Audio: string) {
  // Convert base64 to binary
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

serve(async (req) => {
  // Add detailed logging
  console.log(`Speech-to-text function received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { audioData, format = "webm" } = await req.json();
    
    // Validate request
    if (!audioData) {
      console.error("Invalid request: audio data is missing");
      return new Response(
        JSON.stringify({ error: "Audio data is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    console.log(`Converting speech to text from ${format} format`);
    
    // Check if OpenAI API key exists
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OpenAI API key not found");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Process the audio data
    const audioBytes = processBase64AudioData(audioData);
    
    // Create form data for the API request
    const formData = new FormData();
    const fileName = `audio.${format}`;
    const mimeType = format === "mp3" ? "audio/mpeg" : "audio/webm";
    
    const blob = new Blob([audioBytes], { type: mimeType });
    formData.append("file", blob, fileName);
    formData.append("model", "whisper-1");
    
    // Call OpenAI API to convert speech to text
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || response.statusText;
      } catch (e) {
        errorMessage = await response.text() || response.statusText;
      }
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }
    
    const result = await response.json();
    console.log("Speech-to-text conversion successful");
    
    return new Response(
      JSON.stringify({ 
        success: true,
        text: result.text
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (err) {
    console.error("Error in speech-to-text conversion:", err);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
