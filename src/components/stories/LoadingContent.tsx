
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { AlertCircle, LoaderCircle, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LoadingContentProps {
  count?: number;
  titleWidth?: string;
  showTitle?: boolean;
  message?: string;
  isLoading?: boolean;
  isError?: boolean;
  isInfo?: boolean;
  isWarning?: boolean;
  onRetry?: () => void;
  additionalMessage?: string;
}

const LoadingContent: React.FC<LoadingContentProps> = ({ 
  count = 4, 
  titleWidth = "w-1/3",
  showTitle = true,
  message = "Loading content...",
  isLoading = false,
  isError = false,
  isInfo = false,
  isWarning = false,
  onRetry,
  additionalMessage
}) => {
  return (
    <Card className="p-6 flex flex-col items-center justify-center min-h-[200px]">
      <div className="space-y-6 text-center">
        {isLoading && (
          <div className="space-y-3 w-full max-w-md">
            {showTitle && <Skeleton className={`h-8 ${titleWidth} mx-auto`} />}
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={`h-4 ${i % 2 === 0 ? 'w-full' : (i % 3 === 0 ? 'w-2/3' : 'w-3/4')} mx-auto`} 
              />
            ))}
          </div>
        )}
        
        <div className={`flex flex-col items-center justify-center gap-2 text-center ${
          isError ? 'text-red-500' : (isWarning ? 'text-amber-500' : (isInfo ? 'text-blue-500' : 'text-muted-foreground'))
        }`}>
          <div className={`rounded-full p-3 ${
            isError ? 'bg-red-100 dark:bg-red-900/20' : 
            (isWarning ? 'bg-amber-100 dark:bg-amber-900/20' : 
            (isInfo ? 'bg-blue-100 dark:bg-blue-900/20' : 
            'bg-gray-100 dark:bg-gray-800/50'))
          }`}>
            {isError ? (
              <AlertCircle className="h-6 w-6" />
            ) : isWarning ? (
              <AlertCircle className="h-6 w-6" />
            ) : isInfo ? (
              <Info className="h-6 w-6" />
            ) : (
              <LoaderCircle className="h-6 w-6 animate-spin" />
            )}
          </div>
          
          <p className="text-lg font-medium mt-2">{message}</p>
          
          {additionalMessage && (
            <p className="text-sm text-muted-foreground max-w-md">
              {additionalMessage}
            </p>
          )}
          
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={onRetry}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LoadingContent;
