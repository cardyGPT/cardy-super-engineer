
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, ExternalLink, Trash2, ShieldCheck, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SettingsCard from './common/SettingsCard';
import { SettingsProps } from '@/types/settings';

const GSuiteSettings: React.FC<SettingsProps> = ({ onConfigChange }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load existing settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Validate GSuite configuration 
      const { data, error } = await supabase.functions.invoke('validate-gsuite', {});

      if (error) {
        console.error('Error loading GSuite settings:', error);
        setIsConnected(false);
        if (onConfigChange) onConfigChange(false);
        return;
      }
      
      setIsConnected(!!data?.valid);
      if (onConfigChange) onConfigChange(!!data?.valid);
      
      // If we have settings, populate the form fields
      if (data?.settings) {
        setRedirectUri(data.settings.redirectUri || '');
        setSyncEnabled(data.settings.autoSyncEnabled || false);
      }
    } catch (err) {
      console.error('Error in loadSettings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate required fields if not already connected
      if (!isConnected && (!clientId || !clientSecret)) {
        throw new Error('Client ID and Client Secret are required');
      }
      
      // First, if we have Client ID, Secret or API Key, save them
      if (clientId || clientSecret || apiKey) {
        const { error: keyError } = await supabase.functions.invoke('store-api-keys', {
          body: {
            provider: 'gsuite',
            clientId,
            clientSecret,
            apiKey
          }
        });
        
        if (keyError) {
          throw new Error(keyError.message || 'Failed to save GSuite API credentials');
        }
      }
      
      // Then save the settings
      const { error: settingsError } = await supabase.functions.invoke('save-gsuite-settings', {
        body: {
          redirectUri,
          autoSyncEnabled: syncEnabled,
          skipApiKeyCheck: !clientId && !clientSecret && !apiKey, // Skip API key check if we're not providing them
          metadata: {
            lastUpdated: new Date().toISOString(),
            version: "1.0",
            status: "active"
          }
        }
      });
      
      if (settingsError) {
        throw new Error(settingsError.message || 'Failed to save GSuite settings');
      }
      
      // Validate the settings
      await validateConnection();
      
      toast({
        title: "Settings Saved",
        description: "GSuite settings have been saved successfully",
        variant: "default",
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
      toast({
        title: "Error",
        description: err.message || "Failed to save GSuite settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateConnection = async () => {
    setIsValidating(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-gsuite', {});

      if (error) {
        throw new Error(error.message || 'Failed to validate GSuite connection');
      }

      if (data.valid) {
        toast({
          title: "Connection Valid",
          description: "Your GSuite connection is working correctly",
          variant: "success",
        });
        setIsConnected(true);
        if (onConfigChange) onConfigChange(true);
      } else {
        throw new Error(data.message || "Your GSuite connection is not working correctly");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate connection');
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-gsuite-config', {});
      
      if (error) {
        throw new Error(error.message || 'Failed to disconnect GSuite');
      }
      
      setIsConnected(false);
      setClientId('');
      setClientSecret('');
      setApiKey('');
      setRedirectUri('');
      setSyncEnabled(false);
      if (onConfigChange) onConfigChange(false);
      
      toast({
        title: "Disconnected",
        description: "GSuite connection has been removed",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to disconnect GSuite",
        variant: "destructive",
      });
    }
  };

  return (
    <SettingsCard
      title="Google Workspace Integration"
      description="Configure your Google Workspace integration for document export"
      isConnected={isConnected}
      isError={!!error}
      statusMessage={error || undefined}
      icon={<FileText className="h-5 w-5" />}
      footerContent={
        <div className="flex justify-between w-full">
          {isConnected && (
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={isLoading || isValidating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            {!isLoading && !isValidating && (
              <Button 
                variant="outline" 
                onClick={validateConnection}
                disabled={isValidating || isLoading}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            )}
            
            <Button 
              onClick={handleSaveSettings} 
              disabled={isLoading || isValidating}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </div>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isConnected ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
          <p className="text-green-800 dark:text-green-300 font-medium flex items-center">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Connected to Google Workspace
          </p>
          <p className="text-green-700 dark:text-green-400 text-sm mt-1">
            Your Google Workspace account is connected and working properly.
          </p>
        </div>
      ) : null}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client-id">Client ID {!isConnected && <span className="text-red-500">*</span>}</Label>
          <Input
            id="client-id"
            placeholder="Your Google Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground flex items-center">
            <ExternalLink className="h-3 w-3 mr-1" />
            <a 
              href="https://developers.google.com/workspace/guides/create-credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              How to create Google API credentials
            </a>
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="client-secret">Client Secret {!isConnected && <span className="text-red-500">*</span>}</Label>
          <Input
            id="client-secret"
            type="password"
            placeholder="Your Google Client Secret"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Your Google API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground flex items-center">
            <Key className="h-3 w-3 mr-1" />
            API key for accessing Google APIs that don't require user authorization
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="redirect-uri">Redirect URI</Label>
          <Input
            id="redirect-uri"
            placeholder="https://your-app.com/auth/callback"
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            The URI where Google will redirect after authentication
          </p>
        </div>
        
        <div className="flex items-center justify-between space-x-2 pt-4">
          <Label htmlFor="auto-sync" className="flex-1">Auto-sync with Google Drive</Label>
          <Switch 
            id="auto-sync" 
            checked={syncEnabled}
            onCheckedChange={setSyncEnabled}
            disabled={isLoading}
          />
        </div>
      </div>
    </SettingsCard>
  );
};

export default GSuiteSettings;
