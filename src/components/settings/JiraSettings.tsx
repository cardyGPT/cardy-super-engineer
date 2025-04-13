
import React, { useState, useEffect } from "react";
import { useStories } from "@/contexts/StoriesContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Shield, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import SettingsCard from "./common/SettingsCard";
import { SettingsProps } from '@/types/settings';

const JiraSettings: React.FC<SettingsProps> = ({ onConfigChange }) => {
  const { credentials, setCredentials, isAuthenticated, fetchProjects } = useStories();
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (credentials) {
      setDomain(credentials.domain);
      setEmail(credentials.email);
      // Note: We don't populate the API token field for security reasons
      if (onConfigChange) onConfigChange(true);
    }
  }, [credentials, onConfigChange]);

  const testConnection = async () => {
    if (!domain || !email || !apiToken) {
      setError("Please fill in all the required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the Jira API edge function to test the connection
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          domain,
          email,
          apiToken,
          path: 'myself'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to connect to Jira');
      }

      if (data?.error) {
        throw new Error(data.error || 'Error response from Jira API');
      }

      // Store credentials in localStorage only
      const jiraCredentials = { domain, email, apiToken };
      setCredentials(jiraCredentials);

      toast({
        title: "Connection Successful",
        description: `Connected to Jira as ${data.displayName || email}`,
        variant: "success",
      });

      // Fetch projects after successful connection
      fetchProjects();
      if (onConfigChange) onConfigChange(true);
    } catch (err: any) {
      console.error('Error testing Jira connection:', err);
      
      let errorMessage = err.message || 'Failed to connect to Jira';
      
      // Try to identify if it's a Classic vs Agile API difference
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        errorMessage = 'Authentication failed. Please check your API token and make sure you are using a Classic API Token, not a Personal Access Token.';
      } else if (errorMessage.includes('sprints') || errorMessage.includes('does not support')) {
        errorMessage = 'This project may be using Jira Classic instead of Jira Agile. Some sprint features might be limited.';
      }
      
      setError(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      if (onConfigChange) onConfigChange(false);
    } finally {
      setLoading(false);
    }
  };

  const disconnectJira = () => {
    setCredentials(null);
    setDomain("");
    setEmail("");
    setApiToken("");
    setError(null);
    if (onConfigChange) onConfigChange(false);
    
    toast({
      title: "Disconnected",
      description: "Jira connection has been removed",
      variant: "default",
    });
  };

  return (
    <SettingsCard
      title="Jira Integration"
      description="Connect to your Jira account to access and manage your issues"
      isConnected={isAuthenticated}
      isError={!!error}
      statusMessage={error || undefined}
      icon={<Shield className="h-5 w-5" />}
      footerContent={
        isAuthenticated ? (
          <Button variant="destructive" onClick={disconnectJira}>
            <Trash2 className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        ) : (
          <Button onClick={testConnection} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : "Connect to Jira"}
          </Button>
        )
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isAuthenticated ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
          <p className="text-green-800 dark:text-green-300 font-medium">
            Connected to Jira
          </p>
          <p className="text-green-700 dark:text-green-400 text-sm mt-1">
            Your Jira account is connected and working properly.
          </p>
          {credentials?.domain && (
            <p className="text-green-700 dark:text-green-400 text-sm mt-2">
              Domain: {credentials.domain}
            </p>
          )}
          {credentials?.email && (
            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
              Email: {credentials.email}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Jira Domain URL</Label>
            <Input
              id="domain"
              placeholder="https://your-domain.atlassian.net"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your Atlassian domain URL, e.g., https://your-domain.atlassian.net
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiToken">Classic API Token</Label>
            <Input
              id="apiToken"
              type="password"
              placeholder="Your Jira Classic API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Create a Classic API token on the Atlassian Security page
              </a>
            </p>
          </div>
        </div>
      )}
    </SettingsCard>
  );
};

export default JiraSettings;
