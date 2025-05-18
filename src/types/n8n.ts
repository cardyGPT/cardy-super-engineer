
export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes?: N8nNode[];
  connections?: Record<string, any>;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters?: Record<string, any>;
}

export interface N8nExecutionResult {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error';
  startedAt: string;
  finishedAt?: string;
  data?: Record<string, any>;
  error?: string;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}
