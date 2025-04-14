
import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingContentProps {
  count?: number;
  isLoading?: boolean;
  isError?: boolean;
  isWarning?: boolean;
  isSuccess?: boolean;
  message?: string;
  additionalMessage?: string;
  small?: boolean;
  inline?: boolean;
}

const LoadingContent: React.FC<LoadingContentProps> = ({
  count = 3,
  isLoading = false,
  isError = false,
  isWarning = false,
  isSuccess = false,
  message = "Loading...",
  additionalMessage,
  small = false,
  inline = false
}) => {
  if (inline) {
    return (
      <div className="flex items-center">
        <div className="h-4 w-4 rounded-full animate-pulse bg-muted-foreground mr-2"></div>
        <span>{message}</span>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className={`space-y-${small ? '1' : '2'}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className={`w-full ${small ? 'h-4' : 'h-12'}`} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {message}
          {additionalMessage && (
            <div className="mt-2 text-xs">{additionalMessage}</div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isWarning) {
    return (
      <Alert variant="default" className={`bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {message}
          {additionalMessage && (
            <div className="mt-2 text-xs">{additionalMessage}</div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isSuccess) {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          {message}
          {additionalMessage && (
            <div className="mt-2 text-xs">{additionalMessage}</div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="text-center p-4 text-muted-foreground">
      {message}
      {additionalMessage && (
        <div className="mt-2 text-xs">{additionalMessage}</div>
      )}
    </div>
  );
};

export default LoadingContent;
