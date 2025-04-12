
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Key, Mail, Save, Factory, Link2, CheckCircle, AlertTriangle, Github, FileText, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const SettingsPage: React.FC = () => {
  // Jira Settings
  const [jiraDomain, setJiraDomain] = useState<string>("");
  const [jiraEmail, setJiraEmail] = useState<string>("");
  const [jiraToken, setJiraToken] = useState<string>("");
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  
  // OpenAI Settings
  const [openAIKey, setOpenAIKey] = useState<string>("");
  const [openAIConnected, setOpenAIConnected] = useState<boolean>(false);
  
  // GSuite Settings
  const [gsuiteApiKey, setGsuiteApiKey] = useState<string>("");
  const [gsuiteDriveFolder, setGsuiteDriveFolder] = useState<string>("");
  const [gsuiteAutoSync, setGsuiteAutoSync] = useState<boolean>(false);
  const [gsuiteConnected, setGsuiteConnected] = useState<boolean>(false);
  
  // General state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("jira");
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      try {
        // Check Jira connection
        const jiraCredentials = JSON.parse(localStorage.getItem("jira_credentials") || "null");
        if (jiraCredentials) {
          setJiraDomain(jiraCredentials.domain || "");
          setJiraEmail(jiraCredentials.email || "");
          setJiraToken(""); // Don't show the token for security
          setJiraConnected(true);
        }
        
        // Check OpenAI connection
        const { data: openAIData, error: openAIError } = await supabase.functions.invoke('validate-openai', {});
        
        if (!openAIError && openAIData?.valid) {
          setOpenAIConnected(true);
        }
        
        // Check GSuite connection
        const { data: gsuiteData, error: gsuiteError } = await supabase.functions.invoke('validate-gsuite', {});
        
        console.log("GSuite validation response:", gsuiteData);
        
        if (!gsuiteError && gsuiteData?.valid) {
          setGsuiteConnected(true);
          
          if (gsuiteData.settings) {
            setGsuiteDriveFolder(gsuiteData.settings.defaultDriveFolder || "");
            setGsuiteAutoSync(gsuiteData.settings.autoSync || false);
          }
        } else if (gsuiteError) {
          console.error("Error validating GSuite settings:", gsuiteError);
          toast({
            title: "Error",
            description: "Failed to validate GSuite settings: " + gsuiteError.message,
            variant: "destructive"
          });
        } else if (gsuiteData) {
          console.log("GSuite not connected:", gsuiteData.message);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [toast]);

  const saveJiraSettings = async () => {
    if (!jiraDomain || !jiraEmail || !jiraToken) {
      toast({
        title: "Validation Error",
        description: "Please fill in all Jira connection fields",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Normalize the domain (ensure it has https:// prefix)
      let normalizedDomain = jiraDomain.trim();
      if (!normalizedDomain.startsWith('http')) {
        normalizedDomain = `https://${normalizedDomain}`;
      }
      
      // Remove trailing slash if present
      if (normalizedDomain.endsWith('/')) {
        normalizedDomain = normalizedDomain.slice(0, -1);
      }
      
      const credentials = {
        domain: normalizedDomain,
        email: jiraEmail.trim(),
        token: jiraToken.trim()
      };
      
      // Test the connection
      const { data, error } = await supabase.functions.invoke('jira-api', {
        body: {
          endpoint: 'myself',
          credentials
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data || data.errorMessages) {
        const errorMsg = data.errorMessages ? data.errorMessages.join(", ") : "Invalid credentials";
        throw new Error(errorMsg);
      }
      
      // If connection test passed, save credentials
      localStorage.setItem("jira_credentials", JSON.stringify(credentials));
      setJiraConnected(true);
      
      toast({
        title: "Jira Connected",
        description: `Successfully connected to Jira as ${data.displayName || data.name || jiraEmail}`
      });
      
      return true;
    } catch (err: any) {
      console.error("Error saving Jira settings:", err);
      
      toast({
        title: "Connection Error",
        description: err.message || "Failed to connect to Jira",
        variant: "destructive"
      });
      
      return false;
    }
  };

  const saveOpenAISettings = async () => {
    if (!openAIKey) {
      toast({
        title: "Validation Error",
        description: "Please enter your OpenAI API key",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('store-api-keys', {
        body: { 
          provider: 'openai',
          apiKey: openAIKey.trim()
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Verify key is valid
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('validate-openai', {});
      
      if (verifyError || !verifyData?.valid) {
        const errorMsg = verifyData?.message || verifyError?.message || "Invalid API key";
        throw new Error(errorMsg);
      }
      
      setOpenAIConnected(true);
      setOpenAIKey(""); // Clear the key for security
      
      toast({
        title: "OpenAI Connected",
        description: "Successfully connected to OpenAI API"
      });
      
      return true;
    } catch (err: any) {
      console.error("Error saving OpenAI settings:", err);
      
      toast({
        title: "Connection Error",
        description: err.message || "Failed to connect to OpenAI",
        variant: "destructive"
      });
      
      return false;
    }
  };

  const saveGSuiteSettings = async () => {
    try {
      let success = true;
      
      // If API key provided, save it securely
      if (gsuiteApiKey.trim()) {
        console.log("Saving GSuite API key");
        const { data: storeData, error: storeError } = await supabase.functions.invoke('store-api-keys', {
          body: { 
            provider: 'gsuite',
            apiKey: gsuiteApiKey.trim()
          }
        });
        
        if (storeError) {
          throw new Error(storeError.message);
        }
        
        console.log("API key stored response:", storeData);
      }
      
      // Save other GSuite settings
      console.log("Saving GSuite settings:", {
        defaultDriveFolder: gsuiteDriveFolder.trim(),
        autoSync: gsuiteAutoSync
      });
      
      const { data: settingsData, error: settingsError } = await supabase.functions.invoke('save-gsuite-settings', {
        body: {
          defaultDriveFolder: gsuiteDriveFolder.trim(),
          autoSync: gsuiteAutoSync
        }
      });
      
      if (settingsError) {
        throw new Error(settingsError.message);
      }
      
      console.log("Settings saved response:", settingsData);
      
      // Verify that the settings were saved correctly
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-gsuite', {});
      
      if (validationError) {
        throw new Error(validationError.message);
      }
      
      console.log("Validation response:", validationData);
      
      setGsuiteConnected(validationData?.valid || false);
      setGsuiteApiKey(""); // Clear API key for security
      
      if (validationData?.valid) {
        toast({
          title: "GSuite Connected",
          description: "Successfully connected to GSuite API",
          variant: "success"
        });
      } else if (gsuiteApiKey.trim()) {
        success = false;
        throw new Error(validationData?.message || "Could not validate GSuite API key");
      }
      
      return success;
    } catch (err: any) {
      console.error("Error saving GSuite settings:", err);
      
      toast({
        title: "Connection Error",
        description: err.message || "Failed to connect to GSuite",
        variant: "destructive"
      });
      
      return false;
    }
  };

  const handleSaveSettings = async (tab: string) => {
    setIsSaving(true);
    
    try {
      let success = false;
      
      switch (tab) {
        case "jira":
          success = await saveJiraSettings();
          break;
        case "openai":
          success = await saveOpenAISettings();
          break;
        case "gsuite":
          success = await saveGSuiteSettings();
          break;
        default:
          break;
      }
      
      if (success) {
        // If needed, perform any additional actions on success
      }
    } catch (err) {
      console.error(`Error saving ${tab} settings:`, err);
    } finally {
      setIsSaving(false);
    }
  };

  const disconnectJira = () => {
    localStorage.removeItem("jira_credentials");
    setJiraDomain("");
    setJiraEmail("");
    setJiraToken("");
    setJiraConnected(false);
    
    toast({
      title: "Jira Disconnected",
      description: "Successfully disconnected from Jira"
    });
  };

  const disconnectOpenAI = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-api-key', {
        body: { provider: 'openai' }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setOpenAIConnected(false);
      setOpenAIKey("");
      
      toast({
        title: "OpenAI Disconnected",
        description: "Successfully disconnected from OpenAI API"
      });
    } catch (err: any) {
      console.error("Error disconnecting OpenAI:", err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to disconnect OpenAI",
        variant: "destructive"
      });
    }
  };

  const disconnectGSuite = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-gsuite-config', {});
      
      if (error) {
        throw new Error(error.message);
      }
      
      setGsuiteConnected(false);
      setGsuiteApiKey("");
      setGsuiteDriveFolder("");
      setGsuiteAutoSync(false);
      
      toast({
        title: "GSuite Disconnected",
        description: "Successfully disconnected from GSuite"
      });
    } catch (err: any) {
      console.error("Error disconnecting GSuite:", err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to disconnect GSuite",
        variant: "destructive"
      });
    }
  };

  // Function to navigate back to Jira stories
  const navigateToStories = () => {
    navigate('/stories');
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          
          {jiraConnected && (
            <Button onClick={navigateToStories} variant="outline" className="flex items-center">
              <Factory className="h-4 w-4 mr-2" />
              Back to Jira Stories
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="jira" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
            <TabsTrigger value="jira" className="relative">
              Jira
              {jiraConnected && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-none absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="openai" className="relative">
              OpenAI
              {openAIConnected && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-none absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="gsuite" className="relative">
              GSuite
              {gsuiteConnected && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-none absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="jira">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Factory className="h-6 w-6 mr-2" />
                  Jira Connection
                  {jiraConnected && (
                    <span className="ml-3 inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Connect your Jira account to fetch and manage stories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-domain">Jira Domain</Label>
                  <Input 
                    id="jira-domain" 
                    placeholder="your-company.atlassian.net" 
                    value={jiraDomain}
                    onChange={(e) => setJiraDomain(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Jira domain (e.g., your-company.atlassian.net)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jira-email">Email</Label>
                  <Input 
                    id="jira-email" 
                    type="email" 
                    placeholder="your.email@company.com" 
                    value={jiraEmail}
                    onChange={(e) => setJiraEmail(e.target.value)}
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Generate an API token in your{" "}
                    <a 
                      href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Atlassian account settings
                    </a>
                  </p>
                </div>
                
                <Alert className="bg-blue-50 border border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Security Information</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    <p className="mb-2">Your Jira credentials are secured using industry best practices:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>API tokens are stored in your browser's local storage</li>
                      <li>API requests are processed through secure Edge Functions</li>
                      <li>We never store your credentials on our servers</li>
                      <li>Secure HTTPS connections are used for all API communications</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-between">
                {jiraConnected ? (
                  <>
                    <Button variant="outline" onClick={disconnectJira} disabled={isSaving || isLoading}>
                      Disconnect
                    </Button>
                    <Button onClick={() => handleSaveSettings("jira")} disabled={isSaving || isLoading}>
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-b-2"></span>
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Update Connection
                        </span>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleSaveSettings("jira")} 
                    disabled={isSaving || isLoading}
                  >
                    {isSaving ? (
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
            </Card>
          </TabsContent>
          
          <TabsContent value="openai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Github className="h-6 w-6 mr-2" />
                  OpenAI API Connection
                  {openAIConnected && (
                    <span className="ml-3 inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Connect your OpenAI API key to generate content for your Jira stories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <Input 
                    id="openai-key" 
                    type="password" 
                    placeholder="sk-..." 
                    value={openAIKey}
                    onChange={(e) => setOpenAIKey(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from the{" "}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      OpenAI dashboard
                    </a>
                  </p>
                </div>
                
                <Alert className="bg-blue-50 border border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Security Information</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    <p className="mb-2">Your OpenAI API key is secured using industry best practices:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>API keys are stored as encrypted environment variables</li>
                      <li>Keys are never exposed to browser code or included in application bundles</li>
                      <li>All API requests are processed through secure Edge Functions</li>
                      <li>Secure HTTPS connections are used for all API communications</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-between">
                {openAIConnected ? (
                  <>
                    <Button variant="outline" onClick={disconnectOpenAI} disabled={isSaving || isLoading}>
                      Disconnect
                    </Button>
                    <Button onClick={() => handleSaveSettings("openai")} disabled={isSaving || isLoading}>
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-b-2"></span>
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Update API Key
                        </span>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleSaveSettings("openai")} 
                    disabled={isSaving || isLoading}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-b-2"></span>
                        Connecting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Connect OpenAI API
                      </span>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="gsuite">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-6 w-6 mr-2" />
                  Google Workspace Connection
                  {gsuiteConnected && (
                    <span className="ml-3 inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Connect your Google Workspace account to export content to Google Docs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gsuite-key">Google API Key</Label>
                  <Input 
                    id="gsuite-key" 
                    type="password" 
                    placeholder="Enter your Google API key" 
                    value={gsuiteApiKey}
                    onChange={(e) => setGsuiteApiKey(e.target.value)}
                    disabled={isLoading}
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
                    value={gsuiteDriveFolder}
                    onChange={(e) => setGsuiteDriveFolder(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Documents will be saved to this folder by default
                  </p>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="auto-sync" className="flex-1">Auto-sync with Google Drive</Label>
                  <Switch 
                    id="auto-sync" 
                    checked={gsuiteAutoSync}
                    onCheckedChange={setGsuiteAutoSync}
                    disabled={isLoading}
                  />
                </div>
                
                <Alert className="bg-blue-50 border border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
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
              </CardContent>
              <CardFooter className="flex justify-between">
                {gsuiteConnected ? (
                  <>
                    <Button variant="outline" onClick={disconnectGSuite} disabled={isSaving || isLoading}>
                      Disconnect
                    </Button>
                    <Button onClick={() => handleSaveSettings("gsuite")} disabled={isSaving || isLoading}>
                      {isSaving ? (
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
                    onClick={() => handleSaveSettings("gsuite")} 
                    disabled={isSaving || isLoading || (!gsuiteApiKey && !gsuiteConnected)}
                  >
                    {isSaving ? (
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
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
