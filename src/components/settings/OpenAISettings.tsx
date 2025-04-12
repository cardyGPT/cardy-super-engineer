
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { BrainCircuit, Save, CheckCircle } from "lucide-react";

const OpenAISettings: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("openai_api_key") || "";
  });
  const [defaultModel, setDefaultModel] = useState<string>(() => {
    return localStorage.getItem("openai_default_model") || "gpt-4o-mini";
  });
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    return localStorage.getItem("openai_verified") === "true";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const { toast } = useToast();

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Save to localStorage
    localStorage.setItem("openai_api_key", apiKey);
    localStorage.setItem("openai_default_model", defaultModel);
    
    setTimeout(() => {
      setIsLoading(false);
      
      toast({
        title: "Settings Saved",
        description: "Your OpenAI API settings have been saved successfully.",
        variant: "success",
      });
    }, 500);
  };

  const verifyAPIKey = async () => {
    setIsVerifying(true);
    
    try {
      // Simulate API verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would make an API call to verify the key
      const isValid = apiKey.startsWith("sk-") && apiKey.length > 20;
      
      if (isValid) {
        localStorage.setItem("openai_verified", "true");
        setIsVerified(true);
        
        toast({
          title: "API Key Verified",
          description: "Your OpenAI API key has been verified successfully.",
          variant: "success",
        });
      } else {
        localStorage.setItem("openai_verified", "false");
        setIsVerified(false);
        
        toast({
          title: "Invalid API Key",
          description: "Please check your OpenAI API key and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying API key:", error);
      
      toast({
        title: "Verification Failed",
        description: "There was an error verifying your API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>OpenAI API Settings</span>
          {isVerified && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">OpenAI API Key</Label>
          <div className="flex gap-2">
            <Input 
              id="api-key" 
              placeholder="Enter your OpenAI API key" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={verifyAPIKey}
              disabled={!apiKey || isVerifying}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2"></span>
                  Verifying...
                </span>
              ) : isVerified ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Verified
                </span>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenAI dashboard</a>
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="default-model">Default Model</Label>
          <select 
            id="default-model"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
            <option value="gpt-4o">GPT-4o (More Powerful)</option>
            <option value="gpt-4.5-preview">GPT-4.5 Preview (Experimental)</option>
          </select>
          <p className="text-sm text-muted-foreground">
            Select which model to use by default for generating content
          </p>
        </div>
        
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="streaming" className="flex-1">Enable streaming responses</Label>
            <Switch id="streaming" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="save-history" className="flex-1">Save chat history</Label>
            <Switch id="save-history" defaultChecked />
          </div>
        </div>
        
        <Button 
          onClick={handleSaveSettings} 
          disabled={isLoading} 
          className="w-full mt-4"
        >
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
      </CardContent>
    </Card>
  );
};

export default OpenAISettings;
