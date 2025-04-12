
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface TextToSpeechProps {
  onAddToChat?: (text: string) => void;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ onAddToChat }) => {
  const [text, setText] = useState<string>("");
  const [voice, setVoice] = useState<string>("alloy");
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const voiceOptions = [
    { id: "alloy", name: "Alloy (Balanced)" },
    { id: "echo", name: "Echo (Male)" },
    { id: "fable", name: "Fable (Male)" },
    { id: "onyx", name: "Onyx (Male)" },
    { id: "nova", name: "Nova (Female)" },
    { id: "shimmer", name: "Shimmer (Female)" },
  ];

  const convertTextToSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to convert",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    try {
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text, voice },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.audioData) {
        // Convert base64 to blob URL
        const binary = atob(data.audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);

        toast({
          title: "Success",
          description: "Text converted to speech successfully",
          variant: "success",
        });

        // Auto-play
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
          }
        }, 100);
      }
    } catch (error: any) {
      console.error("Text to speech error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert text to speech",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAddToChat = () => {
    if (onAddToChat && text.trim()) {
      onAddToChat(text);
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
        <CardTitle className="text-xl">Text to Speech</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text-input">Enter text to convert</Label>
          <Textarea
            id="text-input"
            placeholder="Type or paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-32"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice-select">Select voice</Label>
          <Select value={voice} onValueChange={setVoice}>
            <SelectTrigger id="voice-select">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voiceOptions.map((voiceOption) => (
                <SelectItem key={voiceOption.id} value={voiceOption.id}>
                  {voiceOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {audioSrc && (
          <div className="pt-2">
            <audio
              ref={audioRef}
              src={audioSrc}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleAudioEnded}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handlePlayPause}
              className="mr-2"
            >
              {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <span className="text-sm text-muted-foreground">
              {isPlaying ? "Pause audio" : "Play audio"}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {onAddToChat && (
          <Button variant="outline" onClick={handleAddToChat} disabled={!text.trim()}>
            Add to Chat
          </Button>
        )}
        <Button onClick={convertTextToSpeech} disabled={isConverting || !text.trim()}>
          {isConverting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            "Convert to Speech"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TextToSpeech;
