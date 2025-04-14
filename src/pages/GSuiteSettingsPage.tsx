
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ConnectionSettingsProps {
  apiKey: string;
  setApiKey: React.Dispatch<React.SetStateAction<string>>;
  clientId: string;
  setClientId: React.Dispatch<React.SetStateAction<string>>;
  clientSecret: string;
  setClientSecret: React.Dispatch<React.SetStateAction<string>>;
  defaultDriveFolder: string;
  setDefaultDriveFolder: React.Dispatch<React.SetStateAction<string>>;
  isConnected: boolean;
  isValidating: boolean;
  handleConnect: () => Promise<void>;
  handleDisconnect: () => Promise<void>;
}

const ConnectionSettings: React.FC<ConnectionSettingsProps> = ({
  apiKey,
  setApiKey,
  clientId,
  setClientId,
  clientSecret,
  setClientSecret,
  defaultDriveFolder,
  setDefaultDriveFolder,
  isConnected,
  isValidating,
  handleConnect,
  handleDisconnect
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="api-key">Google API Key</Label>
          <Input
            id="api-key"
            placeholder="Enter your Google API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isConnected}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="client-id">Client ID</Label>
          <Input
            id="client-id"
            placeholder="Enter your OAuth Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={isConnected}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="client-secret">Client Secret</Label>
          <Input
            id="client-secret"
            placeholder="Enter your OAuth Client Secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            disabled={isConnected}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="default-folder">Default Drive Folder ID (optional)</Label>
          <Input
            id="default-folder"
            placeholder="Enter default Google Drive folder ID"
            value={defaultDriveFolder}
            onChange={(e) => setDefaultDriveFolder(e.target.value)}
            disabled={isConnected}
          />
          <p className="text-sm text-muted-foreground">
            If provided, content will be saved to this folder by default
          </p>
        </div>
      </div>
      
      <div className="flex justify-end">
        {!isConnected ? (
          <Button onClick={handleConnect} disabled={isValidating || !apiKey || !clientId || !clientSecret}>
            {isValidating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        ) : (
          <Button variant="destructive" onClick={handleDisconnect} disabled={isValidating}>
            {isValidating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

const GSuiteSettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [defaultDriveFolder, setDefaultDriveFolder] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | 'loading' | null>(null);
  const [message, setMessage] = useState('');
  
  const { toast } = useToast();
  
  useEffect(() => {
    // Load existing settings
    const loadSettings = async () => {
      try {
        setStatus('loading');
        
        const { data, error } = await supabase.functions.invoke('validate-gsuite');
        
        if (error) {
          console.error('Error validating GSuite:', error);
          setStatus('error');
          setMessage('Failed to validate GSuite connection');
          return;
        }
        
        if (data.valid) {
          setIsConnected(true);
          setApiKey(data.settings?.apiKey || '');
          setClientId(data.settings?.clientId || '');
          setClientSecret(data.settings?.clientSecret || '');
          setDefaultDriveFolder(data.settings?.defaultFolder || '');
          setStatus('success');
          setMessage('GSuite connection is active');
        } else {
          setIsConnected(false);
          
          // If settings exist but connection is invalid, load the settings
          if (data.settings) {
            setApiKey(data.settings.apiKey || '');
            setClientId(data.settings.clientId || '');
            setClientSecret(data.settings.clientSecret || '');
            setDefaultDriveFolder(data.settings.defaultFolder || '');
          }
          
          setStatus('error');
          setMessage(data.message || 'GSuite connection is not configured');
        }
      } catch (err) {
        console.error('Error loading GSuite settings:', err);
        setStatus('error');
        setMessage('Failed to load GSuite settings');
      }
    };
    
    loadSettings();
  }, []);
  
  const handleConnect = async () => {
    try {
      setIsValidating(true);
      
      const { data, error } = await supabase.functions.invoke('connect-gsuite', {
        body: {
          apiKey,
          clientId,
          clientSecret,
          defaultFolder: defaultDriveFolder
        }
      });
      
      if (error) {
        console.error('Error connecting to GSuite:', error);
        toast({
          title: 'Connection Failed',
          description: error.message || 'Failed to connect to GSuite',
          variant: 'destructive'
        });
        setStatus('error');
        setMessage('Failed to connect to GSuite');
        return;
      }
      
      if (data.success) {
        setIsConnected(true);
        setStatus('success');
        setMessage('GSuite connection is active');
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to GSuite',
        });
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to connect to GSuite');
        toast({
          title: 'Connection Failed',
          description: data.message || 'Failed to connect to GSuite',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Error connecting to GSuite:', err);
      toast({
        title: 'Connection Failed',
        description: err.message || 'Failed to connect to GSuite',
        variant: 'destructive'
      });
      setStatus('error');
      setMessage('Failed to connect to GSuite');
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setIsValidating(true);
      
      const { error } = await supabase.functions.invoke('disconnect-gsuite');
      
      if (error) {
        console.error('Error disconnecting from GSuite:', error);
        toast({
          title: 'Disconnection Failed',
          description: error.message || 'Failed to disconnect from GSuite',
          variant: 'destructive'
        });
        return;
      }
      
      setIsConnected(false);
      setStatus('error');
      setMessage('GSuite connection is not configured');
      toast({
        title: 'Disconnection Successful',
        description: 'Successfully disconnected from GSuite',
      });
    } catch (err: any) {
      console.error('Error disconnecting from GSuite:', err);
      toast({
        title: 'Disconnection Failed',
        description: err.message || 'Failed to disconnect from GSuite',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">GSuite Settings</h1>
          <p className="text-muted-foreground">
            Configure your GSuite connection for Google Drive integration
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                Status of your GSuite API connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === 'loading' ? (
                <div className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  <span>Checking connection status...</span>
                </div>
              ) : status === 'success' ? (
                <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Connected</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : status === 'error' ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Not Connected</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>GSuite API Settings</CardTitle>
              <CardDescription>
                Enter your Google API credentials to enable Drive integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionSettings
                apiKey={apiKey}
                setApiKey={setApiKey}
                clientId={clientId}
                setClientId={setClientId}
                clientSecret={clientSecret}
                setClientSecret={setClientSecret}
                defaultDriveFolder={defaultDriveFolder}
                setDefaultDriveFolder={setDefaultDriveFolder}
                isConnected={isConnected}
                isValidating={isValidating}
                handleConnect={handleConnect}
                handleDisconnect={handleDisconnect}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default GSuiteSettingsPage;
