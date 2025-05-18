
import React, { useState } from 'react';
import { useN8n } from '@/contexts/N8nContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, CheckCircle, AlertCircle, Info } from "lucide-react";
import StatusIndicator from './common/StatusIndicator';

const N8nSettings: React.FC = () => {
  const { isConfigured, configureN8n, baseUrl } = useN8n();
  const [inputBaseUrl, setInputBaseUrl] = useState<string>(baseUrl || 'https://cardy-super-engineer.app.n8n.cloud');
  const [apiKey, setApiKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      await configureN8n(inputBaseUrl, apiKey);
    } catch (err: any) {
      setError(err.message || 'Failed to configure n8n');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          n8n Agentic Workflow Integration
          <StatusIndicator status={isConfigured ? "connected" : "disconnected"} />
        </CardTitle>
        <CardDescription>
          Connect to your n8n instance to enable automated workflows with AI agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="n8n-url">n8n Base URL</Label>
            <Input
              id="n8n-url"
              placeholder="https://your-n8n-instance.com"
              value={inputBaseUrl}
              onChange={(e) => setInputBaseUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              The base URL of your n8n instance (e.g., https://cardy-super-engineer.app.n8n.cloud)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key <span className="text-red-500">*</span></Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Your n8n API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground flex items-center">
              <Info className="h-3 w-3 mr-1" />
              API key for authenticating with your n8n instance (required for secure communication)
            </p>
          </div>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Configuring...
              </>
            ) : isConfigured ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Configuration
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </form>
        
        {isConfigured && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
            <div className="flex items-center text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Connected to n8n</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your Cardy Engineer project is successfully connected to n8n
            </p>
          </div>
        )}
        
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p>To set up n8n for agentic workflows with Google Drive:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm">
              <li>Create an API key in your n8n cloud instance settings</li>
              <li>Configure the connection using the form above</li>
              <li>Ensure your workflow <code>O2LWN9jF5oERhCFZ</code> has HTTP triggers configured</li>
              <li>The system will automatically process documents uploaded to Google Drive</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default N8nSettings;
