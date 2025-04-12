
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface AccountInfoProps {
  isConnected: boolean;
  driveScope: string;
  docsScope: string;
  isLoading: boolean;
  initializing: boolean;
  handleSaveSettings: () => void;
  apiKey: string;
}

const AccountInfo: React.FC<AccountInfoProps> = ({
  isConnected,
  driveScope,
  docsScope,
  isLoading,
  initializing,
  handleSaveSettings,
  apiKey
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Information
        </CardTitle>
        <CardDescription>
          GSuite account details and connection status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-md border">
          <div className="flex items-center mb-4">
            <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          {isConnected ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">API Status</p>
                <p className="text-sm">Active</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Verified</p>
                <p className="text-sm">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Permissions</p>
                <ul className="text-sm list-disc pl-5 mt-1">
                  <li>Google Drive: {driveScope === 'drive.file' ? 'Files only' : driveScope === 'drive.readonly' ? 'Read only' : 'Full access'}</li>
                  <li>Google Docs: {docsScope === 'docs.readonly' ? 'Read only' : 'Full access'}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-4">No active connection</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleSaveSettings}
                disabled={!apiKey && !isConnected || isLoading || initializing}
              >
                Connect Now
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountInfo;
