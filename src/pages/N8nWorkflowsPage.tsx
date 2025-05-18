
import React, { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useN8n } from "@/contexts/N8nContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Play, RotateCcw, Loader2, ExternalLink } from "lucide-react";
import { N8nWorkflow, N8nExecutionResult } from "@/types/n8n";

const N8nWorkflowsPage: React.FC = () => {
  const {
    isConfigured,
    workflows,
    loadingWorkflows,
    refreshWorkflows,
    executeWorkflow,
    activateWorkflow,
    executionResults,
  } = useN8n();
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [executionData, setExecutionData] = useState<string>("{}");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<N8nExecutionResult | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>("");
  
  // Attempt to get the base URL from the first workflow if available
  React.useEffect(() => {
    if (workflows && workflows.length > 0) {
      // This is a simplification - in a real app, you would store this in the context
      setBaseUrl("https://n8n.example.com");
    }
  }, [workflows]);
  
  const handleExecuteWorkflow = async () => {
    if (!selectedWorkflow) return;
    
    setIsExecuting(true);
    try {
      let parsedData = {};
      try {
        parsedData = JSON.parse(executionData);
      } catch (error) {
        console.error("Invalid JSON data:", error);
      }
      
      const result = await executeWorkflow(selectedWorkflow.id, parsedData);
      setExecutionResult(result);
    } catch (error) {
      console.error("Execution error:", error);
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleActivateWorkflow = async (workflowId: string, active: boolean) => {
    try {
      await activateWorkflow(workflowId, active);
    } catch (error) {
      console.error("Activation error:", error);
    }
  };
  
  if (!isConfigured) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold mb-6">n8n Workflows</h1>
          
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              n8n integration is not configured. Please go to settings to configure n8n first.
            </AlertDescription>
          </Alert>
          
          <Button asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">n8n Agentic Workflows</h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshWorkflows}
              disabled={loadingWorkflows}
            >
              {loadingWorkflows ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
        
        {loadingWorkflows ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <Card className="text-center p-8">
            <h3 className="text-xl font-medium mb-2">No workflows found</h3>
            <p className="text-muted-foreground mb-4">
              There are no workflows in your n8n instance or you don't have permission to view them.
            </p>
            <Button asChild className="mt-2">
              <a href="https://n8n.io/workflows" target="_blank" rel="noopener noreferrer">
                Create a Workflow in n8n
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <Switch
                      checked={workflow.active}
                      onCheckedChange={(checked) => handleActivateWorkflow(workflow.id, checked)}
                    />
                  </div>
                  <CardDescription>
                    {workflow.active ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <span className="ml-2 text-xs">
                      Last updated: {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {workflow.nodes?.length || 0} nodes
                  </p>
                </CardContent>
                <CardFooter>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mr-2"
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Execute Workflow: {workflow.name}</DialogTitle>
                        <DialogDescription>
                          Provide data to pass to the workflow execution
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="execution-data">Input Data (JSON)</Label>
                        <Textarea
                          id="execution-data"
                          value={executionData}
                          onChange={(e) => setExecutionData(e.target.value)}
                          className="font-mono h-40"
                          placeholder='{ "key": "value" }'
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={handleExecuteWorkflow} disabled={isExecuting}>
                          {isExecuting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Execute
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                      
                      {executionResult && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-semibold mb-2">Execution Result</h4>
                          <Tabs defaultValue="summary">
                            <TabsList className="mb-2">
                              <TabsTrigger value="summary">Summary</TabsTrigger>
                              <TabsTrigger value="data">Data</TabsTrigger>
                            </TabsList>
                            <TabsContent value="summary">
                              <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm mb-1">
                                  <strong>Status:</strong>{" "}
                                  <Badge
                                    variant={
                                      executionResult.status === "success"
                                        ? "default"
                                        : executionResult.status === "error"
                                        ? "destructive"
                                        : "default"
                                    }
                                  >
                                    {executionResult.status}
                                  </Badge>
                                </p>
                                <p className="text-sm mb-1">
                                  <strong>Started:</strong>{" "}
                                  {new Date(executionResult.startedAt).toLocaleString()}
                                </p>
                                {executionResult.finishedAt && (
                                  <p className="text-sm">
                                    <strong>Finished:</strong>{" "}
                                    {new Date(executionResult.finishedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </TabsContent>
                            <TabsContent value="data">
                              <pre className="p-3 bg-muted rounded-md overflow-x-auto text-xs">
                                {JSON.stringify(executionResult.data || {}, null, 2)}
                              </pre>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={`${baseUrl}/workflow/${workflow.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Edit in n8n
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default N8nWorkflowsPage;
