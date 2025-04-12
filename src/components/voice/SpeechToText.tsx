
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface SpeechToTextProps {
  onAddToChat?: (text: string) => void;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onAddToChat }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = handleAudioStop;
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: `Could not access microphone: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
    }
  };

  const handleAudioStop = async () => {
    if (audioChunksRef.current.length === 0) {
      toast({
        title: "Error",
        description: "No audio recorded",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Convert audio chunks to a single blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        // Get base64 string without the data URL prefix
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke("speech-to-text", {
          body: { audioData: base64Audio, format: "webm" }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data?.text) {
          setTranscribedText(data.text);
          toast({
            title: "Success",
            description: "Speech transcribed successfully",
            variant: "success",
          });
        } else {
          toast({
            title: "Warning",
            description: "No speech was detected",
            variant: "default",
          });
        }
      };
    } catch (error: any) {
      console.error("Speech to text error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to transcribe speech",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (transcribedText) {
      navigator.clipboard.writeText(transcribedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
        variant: "success",
      });
    }
  };

  const handleAddToChat = () => {
    if (onAddToChat && transcribedText.trim()) {
      onAddToChat(transcribedText);
      toast({
        title: "Added to chat",
        description: "Your text has been added to the chat",
        variant: "success",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Speech to Text</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="record-status">Status</Label>
          <div 
            id="record-status"
            className={`rounded-md p-3 flex items-center ${
              isRecording 
                ? "bg-red-50 text-red-700 border border-red-200" 
                : "bg-gray-50 text-gray-700 border border-gray-200"
            }`}
          >
            {isRecording ? (
              <>
                <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
                Recording... Click stop when finished.
              </>
            ) : (
              <>
                <MicOff className="h-4 w-4 mr-2 text-gray-500" />
                Not recording. Click "Start Recording" to begin.
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="transcribed-text">Transcribed Text</Label>
            {transcribedText && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2" 
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            )}
          </div>
          <Textarea
            id="transcribed-text"
            value={transcribedText}
            onChange={(e) => setTranscribedText(e.target.value)}
            placeholder="Your speech will appear here after recording..."
            className="min-h-32"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {onAddToChat && (
            <Button 
              variant="outline" 
              onClick={handleAddToChat} 
              disabled={!transcribedText.trim() || isRecording || isProcessing}
            >
              Add to Chat
            </Button>
          )}
        </div>
        <div>
          {isRecording ? (
            <Button 
              variant="destructive" 
              onClick={stopRecording} 
              disabled={isProcessing}
            >
              <MicOff className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          ) : (
            <Button 
              onClick={startRecording} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default SpeechToText;
