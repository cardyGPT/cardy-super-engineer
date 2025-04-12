
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Link2, Save, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface GSuiteSettingsProps {
  onConfigChange?: (configured: boolean) => void;
}

const GSuiteSettings: React.FC<GSuiteSettingsProps> = ({ onConfigChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [defaultDriveFolder, setDefaultDriveFolder] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [driveScope, setDriveScope] = useState('drive.file');
  const [docsScope, setDocsScope] = useState('docs.full');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if GSuite is configured
    checkGSuiteStatus();
  }, []);

  const checkGSuiteStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-gsuite', {});
      
      if (error) {
        console.error("Error checking GSuite API configuration:", error);
        setIsConnected(false);
        if (onConfigChange) onConfigChange(false);
        return;
      }
      
      console.log("GSuite validation response:", data);
      
      setIsConnected(!!data?.valid);
      if (onConfigChange) onConfigChange(!!data?.valid);
      
      // If we have settings, populate the form
      if (data?.settings) {
        setDefaultDriveFolder(data.settings.defaultDriveFolder || '');
        setAutoSync(data.settings.autoSync || false);
        setDriveScope(data.settings.driveScope || 'drive.file');
        setDocsScope(data.settings.docsScope || 'docs.full');
        
        if (data?.valid) {
          toast({
            title: "GSuite API",
            description: "Your GSuite API configuration is valid and working",
            variant: "success",
          });
        }
      }
    } catch (err) {
      console.error("Error checking GSuite API configuration:", err);
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // If there's an API key, save it first
      if (apiKey.trim()) {
        const { data: keyData, error: keyError } = await supabase.functions.invoke('store-api-keys', {
          body: { 
            provider: 'gsuite',
            apiKey: apiKey.trim() 
          }
        });

        if (keyError) {
          throw new Error(keyError.message || "Failed to save GSuite API key");
        }
      }

      // Save other settings
      const settings = {
        defaultDriveFolder: defaultDriveFolder.trim(),
        autoSync,
        driveScope,
        docsScope,
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: "1.0",
          status: "active"
        }
      };

      const { data: settingsData, error: settingsError } = await supabase.functions.invoke('save-gsuite-settings', {
        body: settings
      });

      if (settingsError) {
        throw new Error(settingsError.message || "Failed to save GSuite settings");
      }

      // Validate the saved configuration
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-gsuite', {});

      if (validationError) {
        throw new Error(validationError.message || "Failed to validate GSuite configuration");
      }

      setIsConnected(!!validationData?.valid);
      if (onConfigChange) onConfigChange(!!validationData?.valid);
      
      // Clear sensitive data
      setApiKey('');

      toast({
        title: "GSuite Settings Saved",
        description: "Your GSuite settings have been successfully saved",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save GSuite settings",
        variant: "destructive",
      });
      setIsConnected(false);
      if (onConfigChange) onConfigChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-gsuite-config', {});
      
      if (error) {
        throw new Error(error.message || "Failed to disconnect from GSuite");
      }
      
      setIsConnected(false);
      setDefaultDriveFolder('');
      setAutoSync(false);
      if (onConfigChange) onConfigChange(false);
      
      toast({
        title: "Disconnected",
        description: "Your GSuite configuration has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect from GSuite",
        variant: "destructive",
      });
    }
  };

  const navigateToGSuiteSettings = () => {
    navigate('/gsuite-settings');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Google Workspace Integration</span>
          {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Your GSuite integration is configured and working"
            : "Connect your Google Workspace account to export content to Google Docs"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSaveSettings}>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-green-800 font-medium">Connected to Google Workspace</p>
                  <p className="text-green-700 text-sm mt-1">
                    Your Google API key is securely stored and working correctly.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="gsuite-key">Google API Key</Label>
              <Input
                id="gsuite-key"
                type="password"
                placeholder="Enter your Google API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This API key should have access to Google Drive and Google Docs APIs
              </p>
            </div>
          )}

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
              checked={autoSync}
              onCheckedChange={setAutoSync}
            />
          </div>

          <Alert className="bg-blue-50 border border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Security Information</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p className="mb-2">Your Google API credentials are secured using industry best practices:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>API keys are stored as encrypted environment variables</li>
                <li>Keys are never exposed to browser code</li>
                <li>All API requests are processed through secure Edge Functions</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isConnected ? (
            <>
              <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>
                Disconnect
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={navigateToGSuiteSettings} disabled={isLoading}>
                  Advanced Settings
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Update Settings"}
                </Button>
              </div>
            </>
          ) : (
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !apiKey.trim()}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2"></span>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Connect to GSuite
                </span>
              )}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default GSuiteSettings;
