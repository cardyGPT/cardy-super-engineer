
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Link2, Loader2 } from "lucide-react";
import { useStories } from "@/contexts/StoriesContext";

interface JiraSettingsProps {
  onConfigChange?: (configured: boolean) => void;
}

const JiraSettings: React.FC<JiraSettingsProps> = ({ onConfigChange }) => {
  const { credentials, setCredentials, isAuthenticated } = useStories();
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize form with existing credentials
    if (credentials) {
      setJiraUrl(credentials.domain || '');
      setJiraEmail(credentials.email || '');
      if (onConfigChange) onConfigChange(true);
    } else {
      if (onConfigChange) onConfigChange(false);
    }
  }, [credentials, onConfigChange]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!jiraUrl.trim() || !jiraEmail.trim() || !jiraToken.trim()) {
        throw new Error("All fields are required");
      }

      // Clean up domain to prevent double https:// issues
      const cleanDomain = jiraUrl.trim()
        .replace(/^https?:\/\//i, '') // Remove any existing http:// or https://
        .replace(/\/+$/, ''); // Remove trailing slashes

      // Validate the Jira credentials
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          action: 'validate',
          domain: cleanDomain,
          email: jiraEmail.trim(),
          apiToken: jiraToken.trim()
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to validate Jira credentials");
      }

      if (data?.error) {
        throw new Error(data.error || "Invalid Jira credentials");
      }

      // Store credentials in context
      setCredentials({
        domain: cleanDomain,
        email: jiraEmail.trim(),
        apiToken: jiraToken.trim()
      });

      // Clear token field for security
      setJiraToken('');

      toast({
        title: "Jira Connected",
        description: "Your Jira credentials have been saved successfully",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Jira",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setCredentials(null);
    setJiraUrl('');
    setJiraEmail('');
    setJiraToken('');
    if (onConfigChange) onConfigChange(false);
    
    toast({
      title: "Disconnected",
      description: "Your Jira credentials have been removed",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Jira Settings</span>
          {isAuthenticated && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          {isAuthenticated
            ? "Your Jira account is connected"
            : "Connect to Jira to import and manage your stories"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSaveCredentials}>
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-green-800 dark:text-green-300 font-medium">Connected to Jira</p>
                  <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                    Your credentials are securely stored.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="jira-url">Jira Domain</Label>
                <Input
                  id="jira-url"
                  placeholder="your-company.atlassian.net"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is usually your-company.atlassian.net (without https://)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jira-email">Email</Label>
                <Input
                  id="jira-email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jira-token">API Token</Label>
                <Input
                  id="jira-token"
                  type="password"
                  placeholder="Your Jira API token"
                  value={jiraToken}
                  onChange={(e) => setJiraToken(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  You can generate an API token in your{" "}
                  <a 
                    href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Atlassian account settings
                  </a>
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {isAuthenticated ? (
            <div className="flex gap-2 w-full justify-between">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                Disconnect
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                Update
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Connect to Jira
                </span>
              )}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default JiraSettings;
