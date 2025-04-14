
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Database, Upload, LayoutDashboard, Code } from "lucide-react";

const DataModelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("diagram");
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Database className="h-8 w-8 mr-2 text-blue-500" />
          <h1 className="text-3xl font-bold">Smart ER / Data Model</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Entity Relationship Diagram</CardTitle>
                    <CardDescription>
                      Visual representation of your data model
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Model
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow overflow-auto p-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <Database className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h3 className="text-xl font-medium">No Data Model</h3>
                    <p className="text-muted-foreground max-w-md">
                      Upload a data model JSON file or create a new model from scratch to visualize your database schema
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button variant="default">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Model
                      </Button>
                      <Button variant="outline">
                        <Code className="h-4 w-4 mr-2" />
                        Create from JSON
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="diagram">Diagram</TabsTrigger>
                <TabsTrigger value="chat">AI Chat</TabsTrigger>
              </TabsList>
              
              <TabsContent value="diagram">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Diagram Settings</CardTitle>
                    <CardDescription>Customize your ER diagram</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Layout</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="justify-start">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Horizontal
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start">
                          <LayoutDashboard className="h-4 w-4 mr-2 rotate-90" />
                          Vertical
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Display Options</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Show Data Types</span>
                          <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Show Foreign Keys</span>
                          <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="chat">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Chat</CardTitle>
                    <CardDescription>Ask questions about your data model</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Import a data model first to enable AI chat functionality
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Model
                    </Button>
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

export default DataModelPage;
