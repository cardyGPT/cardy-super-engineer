
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Link2 } from "lucide-react";

interface JiraSettingsProps {
  onConfigChange?: (configured: boolean) => void;
}

const JiraSettings: React.FC<JiraSettingsProps> = ({ onConfigChange }) => {
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadJiraCredentials = () => {
      try {
        const credentials = JSON.parse(localStorage.getItem("jira_credentials") || "null");
        if (credentials) {
          setJiraUrl(credentials.url || '');
          setJiraEmail(credentials.email || '');
          setIsConnected(true);
          if (onConfigChange) onConfigChange(true);
        } else {
          setIsConnected(false);
          if (onConfigChange) onConfigChange(false);
        }
      } catch (err) {
        console.error("Error loading Jira credentials:", err);
        setIsConnected(false);
        if (onConfigChange) onConfigChange(false);
      }
    };

    loadJiraCredentials();
  }, [onConfigChange]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!jiraUrl.trim() || !jiraEmail.trim() || !jiraToken.trim()) {
        throw new Error("All fields are required");
      }

      // Validate the Jira credentials
      const { error } = await supabase.functions.invoke('jira-api', {
        body: {
          action: 'validate',
          url: jiraUrl,
          email: jiraEmail,
          token: jiraToken
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to validate Jira credentials");
      }

      // Store credentials in localStorage
      const credentials = {
        url: jiraUrl,
        email: jiraEmail,
        token: jiraToken
      };

      localStorage.setItem("jira_credentials", JSON.stringify(credentials));
      setIsConnected(true);
      if (onConfigChange) onConfigChange(true);
      setJiraToken(''); // Clear token for security

      toast({
        title: "Jira Connected",
        description: "Your Jira credentials have been saved successfully",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Jira credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("jira_credentials");
    setIsConnected(false);
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
          {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Your Jira account is connected"
            : "Connect to Jira to import and manage your stories"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSaveCredentials}>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-green-800 font-medium">Connected to Jira</p>
                  <p className="text-green-700 text-sm mt-1">
                    Your credentials are securely stored.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="jira-url">Jira URL</Label>
                <Input
                  id="jira-url"
                  placeholder="https://your-domain.atlassian.net"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                  required
                />
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
                  You can generate an API token from your{" "}
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
          {isConnected ? (
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
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2"></span>
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
