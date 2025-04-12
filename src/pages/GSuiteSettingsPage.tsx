
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Save, Link, FileCheck, CheckCircle } from "lucide-react";

const GSuiteSettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("gsuite_api_key") || "";
  });
  const [defaultDriveFolder, setDefaultDriveFolder] = useState<string>(() => {
    return localStorage.getItem("gsuite_default_drive_folder") || "";
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem("gsuite_auto_sync") === "true";
  });
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return localStorage.getItem("gsuite_connected") === "true";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  
  const { toast } = useToast();

  // Reset the success message after a delay
  useEffect(() => {
    let timeoutId: number;
    if (connectionSuccess) {
      timeoutId = window.setTimeout(() => {
        setConnectionSuccess(false);
      }, 5000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [connectionSuccess]);

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("gsuite_api_key", apiKey);
      localStorage.setItem("gsuite_default_drive_folder", defaultDriveFolder);
      localStorage.setItem("gsuite_auto_sync", autoSyncEnabled.toString());
      localStorage.setItem("gsuite_connected", "true");
      
      setIsConnected(true);
      setIsLoading(false);
      setConnectionSuccess(true);
      
      toast({
        title: "Connection Successful",
        description: "Your GSuite integration settings have been saved and connected successfully.",
        variant: "success",
      });
    }, 1000);
  };

  const handleDisconnect = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.removeItem("gsuite_connected");
      setIsConnected(false);
      setIsLoading(false);
      
      toast({
        title: "Disconnected",
        description: "Your GSuite account has been disconnected.",
        variant: "default",
      });
    }, 1000);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          GSuite Integration Settings
          {isConnected && (
            <span className="ml-3 inline-flex items-center bg-green-100 text-green-700 text-sm px-2.5 py-0.5 rounded">
              <CheckCircle className="w-4 h-4 mr-1" />
              Connected
            </span>
          )}
        </h1>
        
        {connectionSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Connection successful! Your GSuite account is now linked.</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Google Workspace Connection
              </CardTitle>
              <CardDescription>
                Connect your GSuite account to export content directly to Google Docs or Sheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Google API Key</Label>
                <Input 
                  id="api-key" 
                  placeholder="Enter your Google API key" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                />
                <p className="text-sm text-muted-foreground">
                  This API key must have access to Google Drive and Google Docs APIs
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="drive-folder">Default Drive Folder ID (optional)</Label>
                <Input 
                  id="drive-folder" 
                  placeholder="Enter folder ID from Google Drive" 
                  value={defaultDriveFolder}
                  onChange={(e) => setDefaultDriveFolder(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Documents will be saved to this folder by default
                </p>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="auto-sync" className="flex-1">Auto-sync with Google Drive</Label>
                <Switch 
                  id="auto-sync" 
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {isConnected ? (
                <>
                  <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>
                    Disconnect
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-b-2"></span>
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Settings
                      </span>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handleSaveSettings} 
                  disabled={!apiKey || isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-b-2"></span>
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Connect to GSuite
                    </span>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Export Preferences
              </CardTitle>
              <CardDescription>
                Configure how content is exported to Google Workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Export Format</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start border-2 border-primary">
                    <svg 
                      className="h-4 w-4 mr-2 text-blue-600" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                    >
                      <path d="M14.727 6.727H21V21H3V3h11.727v3.727zm0 0H19.5L14.727 2v4.727z"/>
                    </svg>
                    Google Docs
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <svg 
                      className="h-4 w-4 mr-2 text-green-600" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                    >
                      <path d="M21 3H3v18h18V3zm-2 4h-6v2h6v2h-6v2h6v2h-6v2h6v2H5V5h14v2z"/>
                    </svg>
                    Google Sheets
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Content Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="include-meta" defaultChecked />
                    <Label htmlFor="include-meta">Include metadata (ticket ID, timestamps)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="format-code" defaultChecked />
                    <Label htmlFor="format-code">Format code blocks with syntax highlighting</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-toc" defaultChecked />
                    <Label htmlFor="auto-toc">Add table of contents automatically</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Sharing Settings</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-share" />
                    <Label htmlFor="auto-share">Automatically share with team members</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="link-to-jira" defaultChecked />
                    <Label htmlFor="link-to-jira">Add link back to Jira ticket</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>
                Learn how to use the GSuite integration with your Jira tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Connect your Google account using the settings above</li>
                <li>Select a Jira ticket from the Stories page</li>
                <li>Generate LLD, code, or tests using the AI assistant</li>
                <li>Click the "Export to Google" button to save your content</li>
                <li>Access your documents directly in Google Drive</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default GSuiteSettingsPage;
