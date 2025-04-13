
export interface IntegrationStatus {
  isConnected: boolean;
  lastChecked?: Date;
  error?: string;
}

export interface SettingsProps {
  onConfigChange?: (configured: boolean) => void;
}

export interface JiraIntegrationStatus extends IntegrationStatus {
  username?: string;
  domain?: string;
}

export interface OpenAIIntegrationStatus extends IntegrationStatus {
  model?: string;
}

export interface GSuiteIntegrationStatus extends IntegrationStatus {
  email?: string;
}

export interface BitbucketIntegrationStatus extends IntegrationStatus {
  username?: string;
}
