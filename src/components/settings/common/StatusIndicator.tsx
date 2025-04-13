
import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'error' | 'partial';
  message?: string;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  message,
  className = ""
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center ${className}`}>
            {status === 'connected' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : status === 'error' ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : status === 'partial' ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message || (status === 'connected' 
            ? 'Connected' 
            : status === 'error' 
              ? 'Error' 
              : status === 'partial'
                ? 'Partially configured'
                : 'Not connected')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StatusIndicator;
