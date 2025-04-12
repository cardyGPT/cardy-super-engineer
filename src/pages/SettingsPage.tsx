
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";
import JiraLogin from '@/components/stories/JiraLogin';
import { useStories } from '@/contexts/StoriesContext';

const SettingsPage = () => {
  const { isAuthenticated, setCredentials } = useStories();
  const [openAIKey, setOpenAIKey] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [creditBalance, setCreditBalance] = useState<{total: number, used: number, available: number} | null>(null);
  const { toast } = useToast();

  // Load saved API key from localStorage on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setOpenAIKey(savedKey);
      validateOpenAIKey(savedKey, true);
    }
  }, []);

  // Validate OpenAI API key
  const validateOpenAIKey = async (key: string, silent = false) => {
    if (!key.trim()) {
      setKeyStatus('idle');
      setValidationMessage('');
      return;
    }

    setIsValidatingKey(true);
    setKeyStatus('idle');

    try {
      const { data, error } = await supabase.functions.invoke('validate-openai', {
        body: { apiKey: key.trim() }
      });

      if (error) throw new Error(error.message);

      if (data.valid) {
        setKeyStatus('valid');
        setValidationMessage(data.message || 'API key is valid');
        localStorage.setItem('openai_api_key', key.trim());
        
        // Set credit balance if available
        if (data.billing) {
          const { total_granted, total_used, total_available } = data.billing;
          setCreditBalance({
            total: total_granted,
            used: total_used,
            available: total_available
          });
        }

        if (!silent) {
          toast({
            title: "Success",
            description: "OpenAI API key validated successfully",
          });
        }
      } else {
        setKeyStatus('invalid');
        setValidationMessage(data.message || 'Invalid API key');
        setCreditBalance(null);
        
        if (!silent) {
          toast({
            title: "Error",
            description: data.message || "Invalid OpenAI API key",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      setKeyStatus('invalid');
      setValidationMessage(err.message || 'Error validating API key');
      setCreditBalance(null);
      
      if (!silent) {
        toast({
          title: "Error",
          description: err.message || "Failed to validate OpenAI API key",
          variant: "destructive",
        });
      }
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleSubmitOpenAI = (e: React.FormEvent) => {
    e.preventDefault();
    validateOpenAIKey(openAIKey);
  };

  const handleClearOpenAI = () => {
    setOpenAIKey('');
    setKeyStatus('idle');
    setValidationMessage('');
    setCreditBalance(null);
    localStorage.removeItem('openai_api_key');
    
    toast({
      title: "Cleared",
      description: "OpenAI API key has been cleared",
    });
  };

  const handleDisconnectJira = () => {
    setCredentials(null);
    toast({
      title: "Disconnected",
      description: "Jira connection has been removed",
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <Tabs defaultValue="jira" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="jira">Jira Connection</TabsTrigger>
            <TabsTrigger value="openai">OpenAI API</TabsTrigger>
          </TabsList>
          
          <TabsContent value="jira" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Jira Integration</CardTitle>
                <CardDescription>
                  Configure your Jira connection to fetch and manage stories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Connected to Jira</span>
                    </div>
                    
                    <Button variant="destructive" onClick={handleDisconnectJira}>
                      Disconnect from Jira
                    </Button>
                  </div>
                ) : (
                  <JiraLogin />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="openai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>OpenAI API Configuration</CardTitle>
                <CardDescription>
                  Set up your OpenAI API key for AI-powered features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitOpenAI} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <div className="flex">
                      <Input
                        id="openai-key"
                        type="password"
                        value={openAIKey}
                        onChange={(e) => setOpenAIKey(e.target.value)}
                        placeholder="sk-..."
                        className="flex-1"
                      />
                      {openAIKey && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={handleClearOpenAI}
                          className="ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can get your API key from the{" "}
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
                  
                  {keyStatus !== 'idle' && (
                    <div className={`flex items-center space-x-2 text-sm ${
                      keyStatus === 'valid' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {keyStatus === 'valid' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      <span>{validationMessage}</span>
                    </div>
                  )}

                  {creditBalance && (
                    <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                      <h3 className="font-medium">API Credits</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Total Credits:</span>
                          <span>${creditBalance.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Used:</span>
                          <span>${creditBalance.used.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Available:</span>
                          <span>${creditBalance.available.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={isValidatingKey || !openAIKey}
                    className="w-full"
                  >
                    {isValidatingKey ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Validate Key'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
