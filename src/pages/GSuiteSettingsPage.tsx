
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Factory, Link, FileDown, FileCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import refactored components
import ConnectionSettings from "@/components/settings/gsuite/ConnectionSettings";
import QuickStartGuide from "@/components/settings/gsuite/QuickStartGuide";
import ExportSettings from "@/components/settings/gsuite/ExportSettings";
import AccountInfo from "@/components/settings/gsuite/AccountInfo";
import DocumentOptions from "@/components/settings/gsuite/DocumentOptions";
import SecurityAlert from "@/components/settings/gsuite/SecurityAlert";

const GSuiteSettingsPage: React.FC = () => {
  const [clientId, setClientId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
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
            </h1>
          </div>
          <Button onClick={navigateToStories} variant="outline" className="flex items-center">
            <Factory className="h-4 w-4 mr-2" />
            Back to Jira Stories
          </Button>
        </div>
        
        <SecurityAlert />
        
        {connectionSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
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
              <ConnectionSettings 
                clientId={clientId}
                setClientId={setClientId}
                clientSecret={clientSecret}
                setClientSecret={setClientSecret}
                apiKey={apiKey}
                setApiKey={setApiKey}
                defaultDriveFolder={defaultDriveFolder}
                setDefaultDriveFolder={setDefaultDriveFolder}
                autoSyncEnabled={autoSyncEnabled}
                setAutoSyncEnabled={setAutoSyncEnabled}
                driveScope={driveScope}
                setDriveScope={setDriveScope}
                docsScope={docsScope}
                setDocsScope={setDocsScope}
                isConnected={isConnected}
                isLoading={isLoading}
                initializing={initializing}
                handleSaveSettings={handleSaveSettings}
                handleDisconnect={handleDisconnect}
              />
              
              <QuickStartGuide />
            </div>
          </TabsContent>
          
          <TabsContent value="export">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExportSettings 
                exportFormat={exportFormat}
                setExportFormat={setExportFormat}
                includeMetadata={includeMetadata}
                setIncludeMetadata={setIncludeMetadata}
                formatCode={formatCode}
                setFormatCode={setFormatCode}
                autoToc={autoToc}
                setAutoToc={setAutoToc}
                exportOptions={exportOptions}
                setExportOptions={setExportOptions}
                isLoading={isLoading}
                initializing={initializing}
                handleSaveSettings={handleSaveSettings}
              />
              
              <AccountInfo 
                isConnected={isConnected}
                driveScope={driveScope}
                docsScope={docsScope}
                isLoading={isLoading}
                initializing={initializing}
                handleSaveSettings={handleSaveSettings}
                apiKey={apiKey}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="options">
            <DocumentOptions 
              isLoading={isLoading}
              initializing={initializing}
              handleSaveSettings={handleSaveSettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default GSuiteSettingsPage;
