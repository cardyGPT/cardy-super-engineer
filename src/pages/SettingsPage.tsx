
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useStories } from "@/contexts/StoriesContext";
import JiraLogin from "@/components/stories/JiraLogin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const SettingsPage: React.FC = () => {
  const { isAuthenticated, setCredentials, credentials } = useStories();
  const [openAIKey, setOpenAIKey] = useState("");
  const [isValidatingOpenAI, setIsValidatingOpenAI] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleLogout = () => {
    setCredentials(null);
  };

  const validateOpenAIKey = async () => {
    if (!openAIKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an OpenAI API key",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingOpenAI(true);
    setOpenAIStatus(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-openai', {
        body: { apiKey: openAIKey }
      });

      if (error) throw new Error(error.message);

      if (data?.valid) {
        setOpenAIStatus({ valid: true, message: "API key is valid" });
        // Save the key to localStorage for demo purposes
        localStorage.setItem("openai_key", openAIKey);
        toast({
          title: "Success",
          description: "OpenAI API key is valid and has been saved",
        });
      } else {
        setOpenAIStatus({ valid: false, message: data?.message || "Invalid API key" });
        toast({
          title: "Error",
          description: data?.message || "Failed to validate OpenAI API key",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error validating OpenAI key:", err);
      setOpenAIStatus({ valid: false, message: err.message });
      toast({
        title: "Error",
        description: `Failed to validate OpenAI API key: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsValidatingOpenAI(false);
    }
  };

  // Check if OpenAI key exists in localStorage on component mount
  React.useEffect(() => {
    const savedKey = localStorage.getItem("openai_key");
    if (savedKey) {
      setOpenAIKey(savedKey);
      setOpenAIStatus({ valid: true, message: "API key loaded from storage" });
    }
  }, []);

  return (
    <AppLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="jira" className="w-full">
          <TabsList>
            <TabsTrigger value="jira">Jira Connection</TabsTrigger>
            <TabsTrigger value="openai">OpenAI Connection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="jira">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Jira Connection</h2>
              
              {isAuthenticated && (
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect Jira
                </Button>
              )}
            </div>
            
            {!isAuthenticated ? (
              <JiraLogin />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle2 className="text-green-500 mr-2 h-6 w-6" />
                    Connection Successful
                  </CardTitle>
                  <CardDescription>
                    Successfully connected to your Jira account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Domain:</strong> {credentials?.domain}</p>
                    <p><strong>Email:</strong> {credentials?.email}</p>
                    <p><strong>Status:</strong> Connected</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="openai">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">OpenAI Connection</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center ${openAIStatus?.valid ? 'text-green-500' : 'text-amber-500'}`}>
                  {openAIStatus?.valid ? (
                    <>
                      <CheckCircle2 className="mr-2 h-6 w-6" />
                      Connected
                    </>
                  ) : (
                    <>
                      {openAIStatus ? (
                        <AlertCircle className="mr-2 h-6 w-6" />
                      ) : null}
                      {openAIStatus ? 'Connection Failed' : 'Not Configured'}
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {openAIStatus?.message || "Set up OpenAI API key to enable AI-powered features"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={openAIKey}
                      onChange={(e) => setOpenAIKey(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      You can find your API key in your{" "}
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        OpenAI dashboard
                      </a>
                    </p>
                  </div>
                  
                  <Button onClick={validateOpenAIKey} disabled={isValidatingOpenAI}>
                    {isValidatingOpenAI ? "Validating..." : "Validate & Save API Key"}
                  </Button>
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
