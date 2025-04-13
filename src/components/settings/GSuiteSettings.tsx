
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface GSuiteSettingsProps {
  onConfigChange?: (connected: boolean) => void;
}

const GSuiteSettings: React.FC<GSuiteSettingsProps> = ({ onConfigChange }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Fetch GSuite settings from supabase
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .eq('service', 'gsuite')
          .single();

        if (error) {
          console.error('Error loading GSuite settings:', error);
          if (error.code !== 'PGRST116') { // Not found error
            toast({
              title: "Error",
              description: "Failed to load GSuite settings",
              variant: "destructive",
            });
          }
          setIsConnected(false);
          if (onConfigChange) onConfigChange(false);
          return;
        }

        if (data) {
          setClientId(data.api_key || '');
          setClientSecret(data.username || '');
          setRedirectUri(data.domain || '');
          setRefreshToken(data.api_key || ''); // Store refresh token in api_key for simplicity
          setIsConnected(true);
          if (onConfigChange) onConfigChange(true);
        }
      } catch (err) {
        console.error('Error in loadSettings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast, onConfigChange]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save GSuite settings to supabase
      const { error } = await supabase.functions.invoke('save-gsuite-settings', {
        body: {
          clientId,
          clientSecret,
          redirectUri,
          refreshToken
        }
      });

      if (error) {
        console.error('Error saving GSuite settings:', error);
        throw new Error(error.message || 'Failed to save GSuite settings');
      }

      toast({
        title: "Settings Saved",
        description: "GSuite settings have been saved successfully",
        variant: "default",
      });

      setIsConnected(true);
      if (onConfigChange) onConfigChange(true);

    } catch (err: any) {
      console.error('Error in handleSaveSettings:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to save GSuite settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateConnection = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-gsuite', {
        body: {
          clientId,
          clientSecret,
          redirectUri,
          refreshToken
        }
      });

      if (error) {
        console.error('Error validating GSuite connection:', error);
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
        toast({
          title: "Connection Invalid",
          description: data.message || "Your GSuite connection is not working correctly",
          variant: "destructive",
        });
        setIsConnected(false);
        if (onConfigChange) onConfigChange(false);
      }
    } catch (err: any) {
      console.error('Error in handleValidateConnection:', err);
      toast({
        title: "Validation Error",
        description: err.message || "Failed to validate GSuite connection",
        variant: "destructive",
      });
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Google Workspace Settings</span>
          {isConnected ? <CheckCircle className="h-5 w-5 text-green-500" /> : null}
        </CardTitle>
        <CardDescription>
          Configure your Google Workspace integration for document export
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-id">Client ID</Label>
            <Input
              id="client-id"
              placeholder="Your Google API Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-secret">Client Secret</Label>
            <Input
              id="client-secret"
              type="password"
              placeholder="Your Google API Client Secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              disabled={isLoading}
            />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="refresh-token">Refresh Token</Label>
            <Input
              id="refresh-token"
              type="password"
              placeholder="Your Google API Refresh Token"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleValidateConnection}
          disabled={isValidating || isLoading || !clientId || !clientSecret || !refreshToken}
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
        <Button 
          onClick={handleSaveSettings} 
          disabled={isLoading || !clientId || !clientSecret || !redirectUri || !refreshToken}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GSuiteSettings;
