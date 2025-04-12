
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

interface OpenAISettingsProps {
  onConfigChange?: (configured: boolean) => void;
}

const OpenAISettings: React.FC<OpenAISettingsProps> = ({ onConfigChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if API key is configured
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-openai', {});
      
      if (error) {
        console.error("Error checking OpenAI API key:", error);
        setIsConnected(false);
        if (onConfigChange) onConfigChange(false);
        return;
      }
      
      setIsConnected(!!data?.valid);
      if (onConfigChange) onConfigChange(!!data?.valid);
      
      if (data?.valid) {
        toast({
          title: "OpenAI API",
          description: "Your OpenAI API key is configured and working",
          variant: "success",
        });
      }
    } catch (err) {
      console.error("Error checking OpenAI API key:", err);
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!apiKey.trim()) {
        throw new Error("API key cannot be empty");
      }

      // Store the API key securely using Supabase edge function
      const { data, error } = await supabase.functions.invoke('store-api-keys', {
        body: { 
          provider: 'openai',
          apiKey 
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to save API key");
      }

      // Test the API key
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-openai', {});

      if (validationError || !validationData?.valid) {
        throw new Error(validationError?.message || validationData?.error || "Invalid OpenAI API key");
      }

      // Success - API key is valid and saved
      setIsConnected(true);
      if (onConfigChange) onConfigChange(true);
      setApiKey(''); // Clear the input for security

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been securely saved",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save API key",
        variant: "destructive",
      });
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>OpenAI API Settings</span>
          {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Your OpenAI API key is configured and working"
            : "Configure your OpenAI API key to enable AI-powered features"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSaveApiKey}>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-green-800 font-medium">Connected to OpenAI API</p>
                  <p className="text-green-700 text-sm mt-1">
                    Your API key is securely stored and working correctly.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required={!isConnected}
              />
              <p className="text-sm text-muted-foreground">
                You can get your API key from the{" "}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  OpenAI dashboard
                </a>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {isConnected ? (
            <Button
              type="submit"
              className="w-full"
              variant="outline"
              disabled={isLoading}
            >
              Update API Key
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !apiKey.trim()}
            >
              {isLoading ? "Validating..." : "Save API Key"}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default OpenAISettings;
