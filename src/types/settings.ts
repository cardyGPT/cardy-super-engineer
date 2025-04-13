
export interface IntegrationStatus {
  isConnected: boolean;
  lastChecked?: Date;
  error?: string;
}

export interface SettingsProps {
  onConfigChange?: (configured: boolean) => void;
}
