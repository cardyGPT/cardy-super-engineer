
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import JiraLogin from "@/components/stories/JiraLogin";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Mail, 
  Settings, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Key, 
  FileText, 
  Download
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenAISettings from "@/components/settings/OpenAISettings";
import { useStories } from "@/contexts/StoriesContext";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("jira");
  const { isAuthenticated: isJiraAuthenticated } = useStories();
  const [isOpenAIConfigured, setIsOpenAIConfigured] = useState(false);
  const [isGSuiteConfigured, setIsGSuiteConfigured] = useState(false);
  
  // Check if OpenAI API is configured on component mount
  useEffect(() => {
    const checkConfigurations = async () => {
      try {
        // Check OpenAI configuration
        const openAIResponse = await supabase.functions.invoke('validate-openai', {});
        if (!openAIResponse.error && openAIResponse.data?.valid) {
          setIsOpenAIConfigured(true);
        }

        // Check GSuite configuration
        const gsuiteResponse = await supabase.functions.invoke('validate-gsuite', {});
        if (!gsuiteResponse.error && gsuiteResponse.data?.valid) {
          setIsGSuiteConfigured(true);
        }
      } catch (err) {
        console.error("Error checking API configurations:", err);
      }
    };
    
    checkConfigurations();
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="mb-8">
          <Alert className="bg-blue-50 border border-blue-200">
            <Shield className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800">Security Best Practices</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p className="mb-2">Your API keys and credentials are handled according to industry security standards:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All API keys are stored as encrypted environment variables, never in client-side code</li>
                <li>Communication with external services happens via secure Edge Functions</li>
                <li>Keys are never exposed to the browser or included in application bundles</li>
                <li>Secure HTTPS connections are used for all API communications</li>
                <li>Regular security audits and updates are applied to our infrastructure</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
        
        <Tabs defaultValue="jira" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full md:w-auto flex">
            <TabsTrigger value="jira" className="relative flex-1 md:flex-auto">
              Jira Connection
              {isJiraAuthenticated && (
                <span className="absolute -top-1 -right-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="openai" className="relative flex-1 md:flex-auto">
              OpenAI API
              {isOpenAIConfigured && (
                <span className="absolute -top-1 -right-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="gsuite" className="relative flex-1 md:flex-auto">
              GSuite Integration
              {isGSuiteConfigured ? (
                <span className="absolute -top-1 -right-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </span>
              ) : (
                <span className="absolute -top-1 -right-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="jira" className="space-y-4">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Jira Connection</h2>
              <JiraLogin />
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-green-600" />
                  Security Information
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Your Jira credentials are securely handled:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Authentication tokens are securely stored as encrypted environment variables</li>
                  <li>Tokens are never exposed to the client-side application</li>
                  <li>All Jira API requests are proxied through secure Edge Functions</li>
                  <li>Secure HTTPS connections are used for all communications with Jira</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="openai" className="space-y-4">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">OpenAI API Settings</h2>
              <OpenAISettings onConfigChange={(configured) => setIsOpenAIConfigured(configured)} />
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <Key className="h-4 w-4 mr-2 text-green-600" />
                  API Key Security
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Your OpenAI API key is protected:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>API key is stored as an encrypted secret in our secure environment</li>
                  <li>AI requests are processed through secure Edge Functions</li>
                  <li>Your API key is never exposed to browser code or included in application bundles</li>
                  <li>Usage is monitored for suspicious activity</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="gsuite" className="space-y-4">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">GSuite Integration</h2>
              <p className="text-gray-500 mb-4">
                Connect your Google Workspace account to export content directly to Google Docs, Sheets, and more.
              </p>
              
              {isGSuiteConfigured ? (
                <Alert className="bg-green-50 border border-green-200 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <AlertTitle className="text-green-800">Connected to GSuite</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your GSuite integration is configured and working properly.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-amber-50 border border-amber-200 mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <AlertTitle className="text-amber-800">GSuite Integration Not Configured</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Configure GSuite integration to enable document export features.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button asChild>
                <Link to="/gsuite-settings">
                  <Mail className="h-4 w-4 mr-2" />
                  GSuite Settings
                </Link>
              </Button>
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  Google API Security
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Your Google API credentials are secured:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>API keys are stored as encrypted secrets in our secure environment</li>
                  <li>Google API requests are processed through secure Edge Functions</li>
                  <li>Your API key is never exposed to browser code</li>
                  <li>Minimal required permissions are requested for each operation</li>
                  <li>All requests use secure HTTPS connections</li>
                </ul>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Document Export Options
                </CardTitle>
                <CardDescription>
                  Configure how you want to export your generated content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Available Export Formats
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Button variant="outline" className="justify-start">
                        <svg className="h-4 w-4 mr-2 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
                          <path d="M14 2V8H20" fill="white" />
                          <path d="M16 13H8V15H16V13Z" fill="white" />
                          <path d="M16 17H8V19H16V17Z" fill="white" />
                          <path d="M10 9H8V11H10V9Z" fill="white" />
                        </svg>
                        PDF Download
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <svg className="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
                          <path d="M14 2V8H20" fill="white" />
                          <path d="M16 13H8V15H16V13Z" fill="white" />
                          <path d="M16 17H8V19H16V17Z" fill="white" />
                          <path d="M10 9H8V11H10V9Z" fill="white" />
                        </svg>
                        Google Docs Export
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
