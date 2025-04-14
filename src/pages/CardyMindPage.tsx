
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Upload, Database, RefreshCw, Send } from "lucide-react";

const CardyMindPage: React.FC = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    // In a real implementation, this would call the API
    setTimeout(() => {
      setLoading(false);
      setMessage("");
    }, 1000);
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Bot className="h-8 w-8 mr-2 text-purple-500" />
          <h1 className="text-3xl font-bold">Cardy Mind</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle>Chat with your Project Data</CardTitle>
                <CardDescription>
                  Ask questions about your project documentation and data models
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="bg-secondary p-3 rounded-lg max-w-[80%]">
                    <p className="text-sm">
                      Hello! I'm Cardy Mind. I can help you understand your project data and documentation. 
                      What would you like to know?
                    </p>
                  </div>
                </div>
              </CardContent>
              
              <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a question about your project..."
                    className="flex-grow"
                    disabled={loading}
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
          
          <div>
            <Tabs defaultValue="documents">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="datamodel">Data Model</TabsTrigger>
              </TabsList>
              
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Documents</CardTitle>
                    <CardDescription>Select documents to include in context</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md p-4 text-center space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                      <Button variant="outline" size="sm">
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="datamodel">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Models</CardTitle>
                    <CardDescription>Select data models to include in context</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md p-4 text-center space-y-2">
                      <Database className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No data models available</p>
                      <Button variant="outline" size="sm">
                        Import Data Model
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CardyMindPage;
