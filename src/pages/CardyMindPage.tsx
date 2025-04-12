
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AIModelChat } from "@/components/data-model/AIModelChat";
import TextToSpeech from "@/components/voice/TextToSpeech";
import SpeechToText from "@/components/voice/SpeechToText";
import { Mic, Volume2, MessageSquare } from "lucide-react";

const CardyMindPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [chatMessage, setChatMessage] = useState<string>("");

  const handleAddToChat = (text: string) => {
    setChatMessage(text);
    setActiveTab("chat");
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Cardy Mind</h1>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab("text-to-speech")}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Text to Speech
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab("speech-to-text")}
              >
                <Mic className="h-4 w-4 mr-2" />
                Speech to Text
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
              <TabsTrigger value="chat" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="text-to-speech" className="flex items-center">
                <Volume2 className="h-4 w-4 mr-2" />
                Text to Speech
              </TabsTrigger>
              <TabsTrigger value="speech-to-text" className="flex items-center">
                <Mic className="h-4 w-4 mr-2" />
                Speech to Text
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="w-full">
              <div className="w-full max-w-4xl mx-auto">
                <AIModelChat initialMessage={chatMessage} />
              </div>
            </TabsContent>
            
            <TabsContent value="text-to-speech">
              <div className="w-full max-w-2xl mx-auto">
                <TextToSpeech onAddToChat={handleAddToChat} />
              </div>
            </TabsContent>
            
            <TabsContent value="speech-to-text">
              <div className="w-full max-w-2xl mx-auto">
                <SpeechToText onAddToChat={handleAddToChat} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default CardyMindPage;
