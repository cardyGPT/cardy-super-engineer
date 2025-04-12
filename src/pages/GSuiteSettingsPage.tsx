
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Save, Link, FileCheck, CheckCircle, Shield, ArrowLeft, FileDown, Factory, Info, User, FileText, Database, FolderTree, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const GSuiteSettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [defaultDriveFolder, setDefaultDriveFolder] = useState<string>("");
  const [driveScope, setDriveScope] = useState<string>("drive.file");
  const [docsScope, setDocsScope] = useState<string>("docs.full");
  const [sheetsScope, setSheetsScope] = useState<string>("sheets.full");
  const [exportFormat, setExportFormat] = useState<string>("docs");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState("connection");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [formatCode, setFormatCode] = useState(true);
  const [autoToc, setAutoToc] = useState(true);
  const [exportOptions, setExportOptions] = useState({
    angular: true,
    nodejs: true,
    postgres: true
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // Check GSuite settings on load
  useEffect(() => {
    const checkGSuiteSettings = async () => {
      try {
        console.log("Checking GSuite settings...");
        // Check if GSuite API key is stored
        const { data, error } = await supabase.functions.invoke('validate-gsuite', {});
        
        if (error) {
          console.error("Error checking GSuite settings:", error);
          setIsConnected(false);
          setInitializing(false);
          return;
        }
        
        if (data?.valid) {
          console.log("GSuite is connected. Settings:", data.settings);
          setIsConnected(true);
          
          // Load settings
          if (data.settings) {
            setDefaultDriveFolder(data.settings.defaultDriveFolder || "");
            setAutoSyncEnabled(data.settings.autoSync || false);
            setDriveScope(data.settings.driveScope || "drive.file");
            setDocsScope(data.settings.docsScope || "docs.full");
            setSheetsScope(data.settings.sheetsScope || "sheets.full");
            setExportFormat(data.settings.exportFormat || "docs");
            
            if (data.settings.exportOptions) {
              setExportOptions(data.settings.exportOptions);
            }
            
            if (data.settings.contentOptions) {
              setIncludeMetadata(data.settings.contentOptions.includeMetadata ?? true);
              setFormatCode(data.settings.contentOptions.formatCode ?? true);
              setAutoToc(data.settings.contentOptions.autoToc ?? true);
            }
          }
          
          toast({
            title: "GSuite Connection",
            description: "Your GSuite integration is configured and working",
          });
        } else {
          console.log("GSuite is not connected:", data?.message);
          setIsConnected(false);
        }
      } catch (err) {
        console.error("Error checking GSuite settings:", err);
      } finally {
        setInitializing(false);
      }
    };
    
    checkGSuiteSettings();
  }, [toast]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      console.log("Saving GSuite settings...");
      
      // If API key provided, save it securely
      if (apiKey.trim()) {
        // Save API key securely
        const { data: storedData, error: storeError } = await supabase.functions.invoke('store-api-keys', {
          body: { 
            provider: 'gsuite',
            apiKey
          }
        });
        
        if (storeError) {
          throw new Error(storeError.message);
        }
        
        console.log("API key stored successfully:", storedData);
      }
      
      // Prepare content options
      const contentOptions = {
        includeMetadata,
        formatCode,
        autoToc
      };
      
      // Save other settings with metadata
      const enhancedSettings = {
        defaultDriveFolder,
        autoSync: autoSyncEnabled,
        driveScope,
        docsScope,
        sheetsScope,
        exportFormat,
        exportOptions,
        contentOptions,
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: "1.0",
          status: "active"
        }
      };
      
      const { data: settingsData, error: settingsError } = await supabase.functions.invoke('save-gsuite-settings', {
        body: enhancedSettings
      });
      
      if (settingsError) {
        throw new Error(settingsError.message);
      }
      
      console.log("Settings saved successfully:", settingsData);
      
      // Verify that the settings were saved correctly
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-gsuite', {});
      
      if (validationError) {
        throw new Error(validationError.message);
      }
      
      console.log("Validation after save:", validationData);
      
      setIsConnected(validationData?.valid || false);
      setApiKey("");  // Clear API key for security
      setConnectionSuccess(true);
      
      toast({
        title: "Connection Successful",
        description: "Your GSuite integration settings have been saved securely.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Error saving GSuite settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save GSuite settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('delete-gsuite-config', {});
      
      if (error) {
        throw new Error(error.message);
      }
      
      setIsConnected(false);
      setDefaultDriveFolder("");
      setAutoSyncEnabled(false);
      
      toast({
        title: "Disconnected",
        description: "Your GSuite account has been disconnected.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect GSuite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle navigation back to settings
  const handleBackToSettings = () => {
    navigate('/settings');
  };
  
  // Navigate to Jira stories
  const navigateToStories = () => {
    navigate('/stories');
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToSettings} 
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Settings
            </Button>
            <h1 className="text-3xl font-bold flex items-center">
              GSuite Integration Settings
              {isConnected && (
                <span className="ml-3 inline-flex items-center bg-green-100 text-green-700 text-sm px-2.5 py-0.5 rounded">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Connected
                </span>
              )}
            </h1>
          </div>
          <Button onClick={navigateToStories} variant="outline" className="flex items-center">
            <Factory className="h-4 w-4 mr-2" />
            Back to Jira Stories
          </Button>
        </div>
        
        <Alert className="mb-6 bg-blue-50 border border-blue-200">
          <Shield className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-800">Security Information</AlertTitle>
          <AlertDescription className="text-blue-700">
            <p className="mb-2">Your Google API credentials are secured using industry best practices:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>API keys are stored as encrypted environment variables</li>
              <li>Keys are never exposed to browser code or included in application bundles</li>
              <li>All Google API requests are processed through secure Edge Functions</li>
              <li>Secure HTTPS connections are used for all API communications</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        {connectionSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Connection successful! Your GSuite account is now linked securely.</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 w-full max-w-md mx-auto">
            <TabsTrigger value="connection" className="flex items-center gap-1">
              <Link className="h-4 w-4" />
              <span>Connection</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1">
              <FileDown className="h-4 w-4" />
              <span>Export</span>
            </TabsTrigger>
            <TabsTrigger value="options" className="flex items-center gap-1">
              <FileCheck className="h-4 w-4" />
              <span>Options</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection">
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
                      disabled={initializing}
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
                      <ToggleGroup type="single" variant="outline" value={driveScope} onValueChange={(val) => val && setDriveScope(val)} className="justify-start">
                        <ToggleGroupItem value="drive.file" className="flex-1 text-xs">
                          <FolderTree className="h-3 w-3 mr-1" />
                          Files only
                        </ToggleGroupItem>
                        <ToggleGroupItem value="drive.readonly" className="flex-1 text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Read only
                        </ToggleGroupItem>
                        <ToggleGroupItem value="drive.full" className="flex-1 text-xs">
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
                      <ToggleGroup type="single" variant="outline" value={docsScope} onValueChange={(val) => val && setDocsScope(val)} className="justify-start">
                        <ToggleGroupItem value="docs.readonly" className="flex-1 text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Read only
                        </ToggleGroupItem>
                        <ToggleGroupItem value="docs.full" className="flex-1 text-xs">
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
                      disabled={!apiKey && !isConnected || isLoading || initializing}
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
                    <li>Use the "Export to Google" button to save to Google Drive or "Download as PDF" to download locally</li>
                    <li>Content can be generated for various platforms including Angular.js (frontend), Node.js (backend), and PostgreSQL</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="export">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Export & Download Options
                  </CardTitle>
                  <CardDescription>
                    Configure how content is exported to Google Workspace or downloaded as files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Export Format</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={exportFormat === "docs" ? "default" : "outline"} 
                        className="justify-start"
                        onClick={() => setExportFormat("docs")}
                      >
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
                      <Button 
                        variant={exportFormat === "pdf" ? "default" : "outline"} 
                        className="justify-start"
                        onClick={() => setExportFormat("pdf")}
                      >
                        <FileDown className="h-4 w-4 mr-2 text-blue-600" />
                        PDF Download
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download or export your LLDs, code, and test cases in your preferred format
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Content Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="include-meta" 
                          checked={includeMetadata}
                          onCheckedChange={setIncludeMetadata}
                        />
                        <Label htmlFor="include-meta">Include metadata (ticket ID, timestamps)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="format-code" 
                          checked={formatCode}
                          onCheckedChange={setFormatCode}
                        />
                        <Label htmlFor="format-code">Format code blocks with syntax highlighting</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="auto-toc" 
                          checked={autoToc}
                          onCheckedChange={setAutoToc}
                        />
                        <Label htmlFor="auto-toc">Add table of contents automatically</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>File Generation Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="angular-frontend" 
                          checked={exportOptions.angular}
                          onCheckedChange={(checked) => setExportOptions({...exportOptions, angular: checked})}
                        />
                        <Label htmlFor="angular-frontend">Include Angular.js frontend code</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="nodejs-backend" 
                          checked={exportOptions.nodejs}
                          onCheckedChange={(checked) => setExportOptions({...exportOptions, nodejs: checked})}
                        />
                        <Label htmlFor="nodejs-backend">Include Node.js backend code</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="postgres-sql" 
                          checked={exportOptions.postgres}
                          onCheckedChange={(checked) => setExportOptions({...exportOptions, postgres: checked})}
                        />
                        <Label htmlFor="postgres-sql">Include PostgreSQL (SPs, Triggers, Functions)</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={handleSaveSettings} disabled={isLoading || initializing}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    GSuite account details and connection status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-md border">
                    <div className="flex items-center mb-4">
                      <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    
                    {isConnected ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">API Status</p>
                          <p className="text-sm">Active</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Last Verified</p>
                          <p className="text-sm">{new Date().toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Permissions</p>
                          <ul className="text-sm list-disc pl-5 mt-1">
                            <li>Google Drive: {driveScope === 'drive.file' ? 'Files only' : driveScope === 'drive.readonly' ? 'Read only' : 'Full access'}</li>
                            <li>Google Docs: {docsScope === 'docs.readonly' ? 'Read only' : 'Full access'}</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500 mb-4">No active connection</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleSaveSettings}
                          disabled={!apiKey && !isConnected || isLoading || initializing}
                        >
                          Connect Now
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="options">
            <Card>
              <CardHeader>
                <CardTitle>Export Components</CardTitle>
                <CardDescription>
                  Customize which components to include in your documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Document Structure</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="include-title" defaultChecked />
                        <Label htmlFor="include-title">Include document title</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="include-summary" defaultChecked />
                        <Label htmlFor="include-summary">Include ticket summary</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="include-desc" defaultChecked />
                        <Label htmlFor="include-desc">Include ticket description</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="include-sections" defaultChecked />
                        <Label htmlFor="include-sections">Include section headers</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Formatting Options</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="use-page-breaks" defaultChecked />
                        <Label htmlFor="use-page-breaks">Use page breaks between sections</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="include-page-numbers" defaultChecked />
                        <Label htmlFor="include-page-numbers">Include page numbers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="landscape-mode" />
                        <Label htmlFor="landscape-mode">Use landscape orientation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="wide-tables" defaultChecked />
                        <Label htmlFor="wide-tables">Use full-width tables</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={isLoading || initializing} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save All Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default GSuiteSettingsPage;
