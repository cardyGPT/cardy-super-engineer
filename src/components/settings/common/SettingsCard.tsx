
import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import StatusIndicator from './StatusIndicator';

interface SettingsCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footerContent?: ReactNode;
  isConnected?: boolean;
  isError?: boolean;
  isPartial?: boolean;
  statusMessage?: string;
  icon?: ReactNode;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  children,
  footerContent,
  isConnected = false,
  isError = false,
  isPartial = false,
  statusMessage,
  icon
}) => {
  const status = isError ? 'error' : isConnected ? 'connected' : isPartial ? 'partial' : 'disconnected';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </div>
          <StatusIndicator 
            status={status} 
            message={statusMessage} 
          />
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {footerContent && (
        <CardFooter>
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
};

export default SettingsCard;
