
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SettingsCard from './common/SettingsCard';
import { validateApiKey, saveApiKey, removeApiKey } from '@/utils/settingsUtils';
import { SettingsProps } from '@/types/settings';

const OpenAISettings: React.FC<SettingsProps> = ({ onConfigChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if API key is configured
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const isValid = await validateApiKey('OpenAI', 'validate-openai');
      setIsConnected(isValid);
      if (onConfigChange) onConfigChange(isValid);
      
      if (isValid) {
        toast({
          title: "OpenAI API",
          description: "Your OpenAI API key is configured and working",
          variant: "success",
        });
      }
    } catch (err: any) {
      console.error("Error checking OpenAI API key:", err);
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await saveApiKey('openai', apiKey);
      
      if (success) {
        // Test the API key
        const isValid = await validateApiKey('OpenAI', 'validate-openai');
        setIsConnected(isValid);
        if (onConfigChange) onConfigChange(isValid);
        setApiKey(''); // Clear the input for security
      }
    } catch (error: any) {
      setError(error.message || "Failed to save API key");
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const success = await removeApiKey('openai');
      if (success) {
        setIsConnected(false);
        if (onConfigChange) onConfigChange(false);
      }
    } catch (error: any) {
      console.error("Error disconnecting OpenAI:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsCard
      title="OpenAI API Settings"
      description={isConnected 
        ? "Your OpenAI API key is configured and working" 
        : "Configure your OpenAI API key to enable AI-powered features"}
      isConnected={isConnected}
      isError={!!error}
      statusMessage={error || undefined}
      icon={<Brain className="h-5 w-5" />}
      footerContent={
        isConnected ? (
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              Disconnect
            </Button>
            <Button
              onClick={() => setIsConnected(false)}
              disabled={isLoading}
            >
              Update API Key
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !apiKey.trim()}
            onClick={handleSaveApiKey}
          >
            {isLoading ? "Validating..." : "Save API Key"}
          </Button>
        )
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!isConnected ? (
        <div className="space-y-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <Input
            id="openai-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
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
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
          <p className="text-green-800 dark:text-green-300 font-medium">
            Connected to OpenAI API
          </p>
          <p className="text-green-700 dark:text-green-400 text-sm mt-1">
            Your API key is securely stored and working correctly.
          </p>
        </div>
      )}
    </SettingsCard>
  );
};

export default OpenAISettings;
