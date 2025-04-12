
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield } from "lucide-react";

const SecurityAlert: React.FC = () => {
  return (
    <Alert className="mb-6 bg-blue-50 border border-blue-200">
      <Shield className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-blue-800">Security Information</AlertTitle>
      <AlertDescription className="text-blue-700">
        <p className="mb-2">Your Google API credentials are secured using industry best practices:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>API keys are stored as encrypted environment variables</li>
          <li>Keys are never exposed to browser code or included in application bundles</li>
          <li>All Google API requests are processed through secure Edge Functions</li>
          <li>Secure HTTPS connections are used for all API communications</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default SecurityAlert;
