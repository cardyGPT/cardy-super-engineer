
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, ExternalLink, Code } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SettingsCard from './common/SettingsCard';
import { SettingsProps } from '@/types/settings';

const BitbucketSettings: React.FC<SettingsProps> = ({ onConfigChange }) => {
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
    loadSettings();
  }, []);
  
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
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error loading Bitbucket settings:', error);
        }
        setIsConnected(false);
        if (onConfigChange) onConfigChange(false);
        return;
      }
      
      if (data) {
        setUsername(data.username || '');
        // For security, we don't populate the app password field
        
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
          provider: 'bitbucket',
          apiKey: appPassword,
          domain: `${workspace}/${repository}`,
          username: username
        }
      });
      
      if (error) {
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
      setError(err.message || 'Failed to save settings');
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
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
      setError(err.message || 'Failed to validate connection');
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('service', 'bitbucket');
        
      if (error) {
        throw new Error(error.message);
      }
      
      setIsConnected(false);
      setUsername('');
      setAppPassword('');
      setWorkspace('');
      setRepository('');
      if (onConfigChange) onConfigChange(false);
      
      toast({
        title: "Disconnected",
        description: "Bitbucket connection has been removed",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to disconnect Bitbucket",
        variant: "destructive",
      });
    }
  };
  
  return (
    <SettingsCard
      title="Bitbucket Integration"
      description="Configure your Bitbucket integration for code syncing"
      isConnected={isConnected}
      isError={!!error}
      statusMessage={error || undefined}
      icon={<Code className="h-5 w-5" />}
      footerContent={
        <div className="flex justify-between w-full">
          {isConnected && (
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={isLoading || isValidating}
            >
              Disconnect
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              onClick={handleValidateConnection}
              disabled={isValidating || isLoading || !username || (!isConnected && !appPassword) || !workspace || !repository}
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
              disabled={isLoading || !username || (!isConnected && !appPassword) || !workspace || !repository}
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
          </div>
        </div>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
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
          <p className="text-xs text-muted-foreground flex items-center">
            <ExternalLink className="h-3 w-3 mr-1" />
            <a 
              href="https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Create an app password with repository read/write permissions
            </a>
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
    </SettingsCard>
  );
};

export default BitbucketSettings;
