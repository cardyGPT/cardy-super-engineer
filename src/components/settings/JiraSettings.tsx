import React, { useState, useEffect } from "react";
import { useStories } from "@/contexts/StoriesContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Trash2, Info, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const JiraSettings: React.FC = () => {
  const { credentials, setCredentials, isAuthenticated, fetchProjects } = useStories();
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (credentials) {
      setDomain(credentials.domain);
      setEmail(credentials.email);
      setApiToken(credentials.apiToken); // Note: This will be masked in the UI
    }
  }, [credentials]);

  const testConnection = async () => {
    if (!domain || !email || !apiToken) {
      setTestResult({
        success: false,
        message: "Please fill in all the required fields."
      });
      return;
    }

    setLoading(true);
    setTestResult(null);

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
        throw new Error('Failed to connect to Jira');
      }

      // If successful, save the credentials to localStorage only
      setTestResult({
        success: true,
        message: `Successfully connected to Jira as ${data.displayName}`
      });

      // Store credentials in localStorage only
      const jiraCredentials = { domain, email, apiToken };
      setCredentials(jiraCredentials);

      toast({
        title: "Connection Successful",
        description: `Connected to Jira as ${data.displayName}`,
        variant: "success",
      });

      // Fetch projects after successful connection
      fetchProjects();
    } catch (err: any) {
      console.error('Error testing Jira connection:', err);
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to Jira'
      });
      
      toast({
        title: "Connection Failed",
        description: err.message || 'Failed to connect to Jira',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectJira = () => {
    setCredentials(null);
    setDomain("");
    setEmail("");
    setApiToken("");
    setTestResult(null);
    
    toast({
      title: "Disconnected",
      description: "Jira connection has been removed",
      variant: "default",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Jira Integration
        </CardTitle>
        <CardDescription>
          Connect to your Jira account to access and manage your issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated ? (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-400">Connected to Jira</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-500">
              Your Jira account is connected and working properly.
            </AlertDescription>
          </Alert>
        ) : (
          <>
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
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                placeholder="Your Jira API token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
              />
              <p className="text-sm text-muted-foreground flex items-center">
                <Info className="h-3 w-3 mr-1" />
                <a
                  href="https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  How to generate an API token
                </a>
              </p>
            </div>

            {testResult && (
              <Alert
                variant={testResult.success ? "default" : "destructive"}
                className={testResult.success ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : ""}
              >
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>{testResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {isAuthenticated ? (
          <Button variant="destructive" onClick={disconnectJira}>
            <Trash2 className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        ) : (
          <Button onClick={testConnection} disabled={loading}>
            {loading ? "Testing..." : "Connect to Jira"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JiraSettings;
