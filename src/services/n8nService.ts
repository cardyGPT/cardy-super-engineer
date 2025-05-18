
import { supabase } from '@/lib/supabase';
import { N8nWorkflow, N8nExecutionResult, N8nCredential } from '@/types/n8n';

class N8nService {
  private baseUrl: string | null = null;
  private apiKey: string | null = null;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    try {
      // Retrieve n8n settings from Supabase
      const { data, error } = await supabase
        .from('user_preferences')
        .select('settings')
        .single();
        
      if (error) throw error;
      
      if (data?.settings?.n8n) {
        this.baseUrl = data.settings.n8n.baseUrl;
        this.apiKey = data.settings.n8n.apiKey;
      }
    } catch (error) {
      console.error("Failed to initialize N8nService:", error);
    }
  }
  
  private getHeaders() {
    if (!this.apiKey) {
      throw new Error("n8n API key not configured");
    }
    
    return {
      'X-N8N-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }
  
  async isConfigured(): Promise<boolean> {
    return !!(this.baseUrl && this.apiKey);
  }
  
  async saveConfig(baseUrl: string, apiKey: string): Promise<void> {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    
    // Save to user preferences
    await supabase
      .from('user_preferences')
      .update({
        settings: {
          n8n: { baseUrl, apiKey }
        }
      })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
  }
  
  async getWorkflows(): Promise<N8nWorkflow[]> {
    if (!this.baseUrl) {
      throw new Error("n8n base URL not configured");
    }
    
    const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch workflows: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getWorkflow(id: string): Promise<N8nWorkflow> {
    if (!this.baseUrl) {
      throw new Error("n8n base URL not configured");
    }
    
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${id}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async activateWorkflow(id: string, active: boolean): Promise<N8nWorkflow> {
    if (!this.baseUrl) {
      throw new Error("n8n base URL not configured");
    }
    
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${id}/activate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ active }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update workflow status: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async executeWorkflow(id: string, data?: Record<string, any>): Promise<N8nExecutionResult> {
    if (!this.baseUrl) {
      throw new Error("n8n base URL not configured");
    }
    
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${id}/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to execute workflow: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getCredentials(): Promise<N8nCredential[]> {
    if (!this.baseUrl) {
      throw new Error("n8n base URL not configured");
    }
    
    const response = await fetch(`${this.baseUrl}/api/v1/credentials`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch credentials: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const n8nService = new N8nService();
