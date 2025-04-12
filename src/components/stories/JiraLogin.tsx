
import React, { useState } from "react";
import { useStories } from "@/contexts/StoriesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { JiraCredentials } from "@/types/jira";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const JiraLogin: React.FC = () => {
  const { setCredentials } = useStories();
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // Create credentials object
      const credentials: JiraCredentials = {
        domain: domain.trim(),
        email: email.trim(),
        apiToken: apiToken.trim()
      };
      
      console.log("Testing Jira connection with credentials:", { domain: credentials.domain, email: credentials.email });
      
      // Validate credentials by making a test API call
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'myself',
          credentials
        }
      });
      
      console.log("Jira API response:", data);
      
      if (error || !data || data.error) {
        console.error("Jira login error:", error || data?.error);
        throw new Error(error?.message || data?.error || "Invalid Jira credentials");
      }
      
      // Credentials are valid, save them
      setCredentials(credentials);
      
      toast({
        title: "Connection Successful",
        description: `Connected to Jira as ${data.displayName || email}`,
      });
      
      setIsLoading(false);
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Failed to connect to Jira");
      setIsLoading(false);
      
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Jira",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect to Jira</CardTitle>
        <CardDescription>
          Enter your Jira credentials to validate the connection
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {loginError && (
            <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
              {loginError}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="domain">Jira Domain</Label>
            <Input
              id="domain"
              placeholder="your-company.atlassian.net"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This is usually your-company.atlassian.net (without https://)
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
              required
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
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Testing Connection..." : "Test Jira Connection"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JiraLogin;
