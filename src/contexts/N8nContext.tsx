
import React, { createContext, useContext, useState, useEffect } from 'react';
import { n8nService } from '@/services/n8nService';
import { N8nWorkflow, N8nExecutionResult } from '@/types/n8n';
import { useToast } from '@/hooks/use-toast';

interface N8nContextType {
  isConfigured: boolean;
  baseUrl: string | null;
  configureN8n: (baseUrl: string, apiKey: string) => Promise<void>;
  workflows: N8nWorkflow[];
  loadingWorkflows: boolean;
  refreshWorkflows: () => Promise<void>;
  executeWorkflow: (workflowId: string, data?: Record<string, any>) => Promise<N8nExecutionResult>;
  activateWorkflow: (workflowId: string, active: boolean) => Promise<void>;
  executionResults: Record<string, N8nExecutionResult>;
}

const N8nContext = createContext<N8nContextType | null>(null);

export const useN8n = () => {
  const context = useContext(N8nContext);
  if (!context) {
    throw new Error('useN8n must be used within a N8nProvider');
  }
  return context;
};

export const N8nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState<boolean>(false);
  const [executionResults, setExecutionResults] = useState<Record<string, N8nExecutionResult>>({});
  const { toast } = useToast();
  
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const configured = await n8nService.isConfigured();
        setIsConfigured(configured);
        
        if (configured) {
          const url = await n8nService.getBaseUrl();
          setBaseUrl(url);
          refreshWorkflows();
        }
      } catch (error) {
        console.error('Error checking n8n configuration:', error);
      }
    };
    
    checkConfiguration();
  }, []);
  
  const configureN8n = async (baseUrl: string, apiKey: string) => {
    try {
      await n8nService.saveConfig(baseUrl, apiKey);
      setIsConfigured(true);
      setBaseUrl(baseUrl);
      toast({
        title: "n8n Configuration Saved",
        description: "Successfully connected to n8n",
        variant: "success",
      });
      await refreshWorkflows();
    } catch (error: any) {
      toast({
        title: "Configuration Error",
        description: error.message || "Failed to save n8n configuration",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const refreshWorkflows = async () => {
    try {
      setLoadingWorkflows(true);
      const workflowList = await n8nService.getWorkflows();
      setWorkflows(workflowList);
    } catch (error: any) {
      toast({
        title: "Error Loading Workflows",
        description: error.message || "Failed to load n8n workflows",
        variant: "destructive",
      });
    } finally {
      setLoadingWorkflows(false);
    }
  };
  
  const executeWorkflow = async (workflowId: string, data?: Record<string, any>) => {
    try {
      const result = await n8nService.executeWorkflow(workflowId, data);
      setExecutionResults(prev => ({
        ...prev,
        [workflowId]: result
      }));
      
      toast({
        title: "Workflow Executed",
        description: result.status === 'success' ? "Workflow completed successfully" : "Workflow execution in progress",
      });
      
      return result;
    } catch (error: any) {
      toast({
        title: "Workflow Execution Failed",
        description: error.message || "Failed to execute workflow",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const activateWorkflow = async (workflowId: string, active: boolean) => {
    try {
      await n8nService.activateWorkflow(workflowId, active);
      
      // Update the workflows list
      setWorkflows(workflows.map(workflow => 
        workflow.id === workflowId ? { ...workflow, active } : workflow
      ));
      
      toast({
        title: active ? "Workflow Activated" : "Workflow Deactivated",
        description: `Workflow has been ${active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Workflow Status Update Failed",
        description: error.message || `Failed to ${active ? 'activate' : 'deactivate'} workflow`,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  return (
    <N8nContext.Provider value={{
      isConfigured,
      baseUrl,
      configureN8n,
      workflows,
      loadingWorkflows,
      refreshWorkflows,
      executeWorkflow,
      activateWorkflow,
      executionResults,
    }}>
      {children}
    </N8nContext.Provider>
  );
};
