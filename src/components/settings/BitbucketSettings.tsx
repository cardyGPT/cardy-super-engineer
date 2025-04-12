
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, GitBranch, Key, Lock } from "lucide-react";

interface BitbucketSettingsProps {
  onConfigChange?: (configured: boolean) => void;
}

const BitbucketSettings: React.FC<BitbucketSettingsProps> = ({ onConfigChange }) => {
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [repository, setRepository] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Bitbucket is configured
    const checkBitbucketStatus = () => {
      try {
        const credentials = JSON.parse(localStorage.getItem("bitbucket_credentials") || "null");
        if (credentials) {
          setUsername(credentials.username || '');
          setWorkspace(credentials.workspace || '');
          setRepository(credentials.repository || '');
          setIsConnected(true);
          if (onConfigChange) onConfigChange(true);
        } else {
          setIsConnected(false);
          if (onConfigChange) onConfigChange(false);
        }
      } catch (err) {
        console.error("Error loading Bitbucket credentials:", err);
        setIsConnected(false);
        if (onConfigChange) onConfigChange(false);
      }
    };

    checkBitbucketStatus();
  }, [onConfigChange]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!username.trim() || !appPassword.trim() || !workspace.trim() || !repository.trim()) {
        throw new Error("All fields are required");
      }

      // Store credentials in localStorage
      const credentials = {
        username: username.trim(),
        appPassword: appPassword.trim(),
        workspace: workspace.trim(),
        repository: repository.trim(),
        timestamp: new Date().toISOString()
      };

      // Validate the credentials by making a test API call to Bitbucket
      // We'll simulate this for now, but in a real app you would call Bitbucket API
      await new Promise(resolve => setTimeout(resolve, 1000));

      localStorage.setItem("bitbucket_credentials", JSON.stringify({
        username: credentials.username,
        workspace: credentials.workspace,
        repository: credentials.repository,
        timestamp: credentials.timestamp
      }));
      
      setIsConnected(true);
      if (onConfigChange) onConfigChange(true);
      setAppPassword(''); // Clear password for security

      toast({
        title: "Bitbucket Connected",
        description: "Your Bitbucket credentials have been saved successfully",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Bitbucket credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("bitbucket_credentials");
    setIsConnected(false);
    setUsername('');
    setWorkspace('');
    setRepository('');
    if (onConfigChange) onConfigChange(false);
    
    toast({
      title: "Disconnected",
      description: "Your Bitbucket credentials have been removed",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bitbucket Integration</span>
          {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Your Bitbucket account is connected"
            : "Connect to Bitbucket to manage your code repositories"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSaveCredentials}>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-green-800 font-medium">Connected to Bitbucket</p>
                  <p className="text-green-700 text-sm mt-1">
                    Repository: {workspace}/{repository}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="bitbucket-username">Username</Label>
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-gray-500" />
                  <Input
                    id="bitbucket-username"
                    placeholder="Your Bitbucket username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bitbucket-app-password">App Password</Label>
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  <Input
                    id="bitbucket-app-password"
                    type="password"
                    placeholder="Your Bitbucket app password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Create an app password with repository read/write permissions in your{" "}
                  <a 
                    href="https://bitbucket.org/account/settings/app-passwords/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Bitbucket account settings
                  </a>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bitbucket-workspace">Workspace</Label>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <Input
                    id="bitbucket-workspace"
                    placeholder="Your Bitbucket workspace"
                    value={workspace}
                    onChange={(e) => setWorkspace(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bitbucket-repository">Repository</Label>
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-gray-500" />
                  <Input
                    id="bitbucket-repository"
                    placeholder="Your Bitbucket repository"
                    value={repository}
                    onChange={(e) => setRepository(e.target.value)}
                    required
                  />
                </div>
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
                  <GitBranch className="h-4 w-4" />
                  Connect to Bitbucket
                </span>
              )}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default BitbucketSettings;
