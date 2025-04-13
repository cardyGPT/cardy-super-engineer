
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BitbucketSettingsProps {
  onConfigChange?: (connected: boolean) => void;
}

const BitbucketSettings: React.FC<BitbucketSettingsProps> = ({ onConfigChange }) => {
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [repository, setRepository] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Fetch Bitbucket settings from supabase
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .eq('service', 'bitbucket')
          .single();
          
        if (error) {
          console.error('Error loading Bitbucket settings:', error);
          if (error.code !== 'PGRST116') { // Not found error
            toast({
              title: "Error",
              description: "Failed to load Bitbucket settings",
              variant: "destructive",
            });
          }
          setIsConnected(false);
          if (onConfigChange) onConfigChange(false);
          return;
        }
        
        if (data) {
          setUsername(data.username || '');
          setAppPassword(data.api_key || '');
          
          // Parse domain field for workspace and repository
          if (data.domain) {
            try {
              const [ws, repo] = data.domain.split('/');
              setWorkspace(ws || '');
              setRepository(repo || '');
            } catch (e) {
              console.error('Error parsing workspace/repository:', e);
            }
          }
          
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
    setError(null);
    
    try {
      if (!username || !appPassword || !workspace || !repository) {
        throw new Error('All fields are required');
      }
      
      // Save Bitbucket settings to supabase
      const { error } = await supabase.functions.invoke('store-api-keys', {
        body: {
          service: 'bitbucket',
          apiKey: appPassword,
          domain: `${workspace}/${repository}`,
          username: username
        }
      });
      
      if (error) {
        console.error('Error saving Bitbucket settings:', error);
        throw new Error(error.message || 'Failed to save Bitbucket settings');
      }
      
      toast({
        title: "Settings Saved",
        description: "Bitbucket settings have been saved successfully",
        variant: "default",
      });
      
      setIsConnected(true);
      if (onConfigChange) onConfigChange(true);
      
    } catch (err: any) {
      console.error('Error in handleSaveSettings:', err);
      setError(err.message || 'Failed to save settings');
      toast({
        title: "Error",
        description: err.message || "Failed to save Bitbucket settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleValidateConnection = async () => {
    setIsValidating(true);
    setError(null);
    
    try {
      if (!username || !appPassword || !workspace || !repository) {
        throw new Error('All fields are required');
      }
      
      // Simple validation - just check if we can get the repository info
      const auth = btoa(`${username}:${appPassword}`);
      const response = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repository}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to connect to Bitbucket: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.name) {
        toast({
          title: "Connection Valid",
          description: `Successfully connected to ${data.name}`,
          variant: "success",
        });
        setIsConnected(true);
        if (onConfigChange) onConfigChange(true);
      } else {
        throw new Error('Invalid response from Bitbucket');
      }
    } catch (err: any) {
      console.error('Error in handleValidateConnection:', err);
      setError(err.message || 'Failed to validate connection');
      toast({
        title: "Validation Error",
        description: err.message || "Failed to validate Bitbucket connection",
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
          <span>Bitbucket Settings</span>
          {isConnected ? <CheckCircle className="h-5 w-5 text-green-500" /> : null}
        </CardTitle>
        <CardDescription>
          Configure your Bitbucket integration for code syncing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Your Bitbucket username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="app-password">App Password</Label>
            <Input
              id="app-password"
              type="password"
              placeholder="Your Bitbucket app password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Create an app password with repository read/write permissions in your Bitbucket account settings
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <Input
              id="workspace"
              placeholder="Your Bitbucket workspace name"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="repository">Repository</Label>
            <Input
              id="repository"
              placeholder="Your Bitbucket repository name"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleValidateConnection}
          disabled={isValidating || isLoading || !username || !appPassword || !workspace || !repository}
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
          disabled={isLoading || !username || !appPassword || !workspace || !repository}
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

export default BitbucketSettings;
