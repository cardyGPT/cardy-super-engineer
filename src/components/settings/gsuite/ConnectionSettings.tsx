
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info, Save, Link, Mail, FolderTree, Lock, Database, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ConnectionSettingsProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  clientId: string;
  setClientId: (value: string) => void;
  clientSecret: string;
  setClientSecret: (value: string) => void;
  defaultDriveFolder: string;
  setDefaultDriveFolder: (value: string) => void;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (value: boolean) => void;
  driveScope: string;
  setDriveScope: (value: string) => void;
  docsScope: string;
  setDocsScope: (value: string) => void;
  isConnected: boolean;
  isLoading: boolean;
  initializing: boolean;
  handleSaveSettings: () => void;
  handleDisconnect: () => void;
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
  autoSyncEnabled,
  setAutoSyncEnabled,
  driveScope,
  setDriveScope,
  docsScope,
  setDocsScope,
  isConnected,
  isLoading,
  initializing,
  handleSaveSettings,
  handleDisconnect
}) => {
  return (
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
          <Label htmlFor="client-id">Google Client ID</Label>
          <Input 
            id="client-id" 
            placeholder="Enter your Google Client ID" 
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={initializing}
          />
          <p className="text-sm text-muted-foreground">
            Get your Google API Client ID from the Google Cloud Console
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="client-secret">Client Secret</Label>
          <Input 
            id="client-secret" 
            placeholder="Enter your Google Client Secret" 
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            type="password"
            disabled={initializing}
          />
          <p className="text-sm text-muted-foreground">
            Your Client Secret is used to authenticate with Google APIs
          </p>
        </div>
        
        {/* Only show API key field if needed */}
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key (Optional)</Label>
          <Input 
            id="api-key" 
            placeholder="Enter your Google API Key (optional)" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
            disabled={initializing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="drive-folder">Default Drive Folder ID (optional)</Label>
          <Input 
            id="drive-folder" 
            placeholder="Enter folder ID from Google Drive" 
            value={defaultDriveFolder}
            onChange={(e) => setDefaultDriveFolder(e.target.value)}
            disabled={initializing}
          />
          <p className="text-sm text-muted-foreground">
            Documents will be saved to this folder by default
          </p>
        </div>
        
        <div className="space-y-4 border rounded-md p-4">
          <Label>API Scopes</Label>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="drive-scope" className="text-sm">Google Drive Scope</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-80">Controls what access your application has to Drive files</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <ToggleGroup type="single" value={driveScope} onValueChange={(val) => val && setDriveScope(val)} className="justify-start">
              <ToggleGroupItem value="drive.file" variant="outline" size="default" className="flex-1 text-xs">
                <FolderTree className="h-3 w-3 mr-1" />
                Files only
              </ToggleGroupItem>
              <ToggleGroupItem value="drive.readonly" variant="outline" size="default" className="flex-1 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Read only
              </ToggleGroupItem>
              <ToggleGroupItem value="drive.full" variant="outline" size="default" className="flex-1 text-xs">
                <Database className="h-3 w-3 mr-1" />
                Full access
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="docs-scope" className="text-sm">Google Docs Scope</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-80">Controls what access your application has to Docs files</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <ToggleGroup type="single" value={docsScope} onValueChange={(val) => val && setDocsScope(val)} className="justify-start">
              <ToggleGroupItem value="docs.readonly" variant="outline" size="default" className="flex-1 text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Read only
              </ToggleGroupItem>
              <ToggleGroupItem value="docs.full" variant="outline" size="default" className="flex-1 text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Full access
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="auto-sync" className="flex-1">Auto-sync with Google Drive</Label>
          <Switch 
            id="auto-sync" 
            checked={autoSyncEnabled}
            onCheckedChange={setAutoSyncEnabled}
            disabled={initializing}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isConnected ? (
          <>
            <Button variant="outline" onClick={handleDisconnect} disabled={isLoading || initializing}>
              Disconnect
            </Button>
            <Button onClick={handleSaveSettings} disabled={isLoading || initializing}>
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
            disabled={(!clientId || !clientSecret) && !isConnected || isLoading || initializing}
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
  );
};

export default ConnectionSettings;
