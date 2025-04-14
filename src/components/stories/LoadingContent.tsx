
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
    <Card className="p-4">
      <div className="space-y-3">
        {showTitle && <Skeleton className={`h-8 ${titleWidth}`} />}
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={`h-4 ${i % 2 === 0 ? 'w-full' : (i % 3 === 0 ? 'w-2/3' : 'w-3/4')}`} 
          />
        ))}
        <div className={`flex items-center justify-center gap-2 text-center text-sm ${
          isError ? 'text-red-500' : (isWarning ? 'text-amber-500' : (isInfo ? 'text-blue-500' : 'text-muted-foreground'))
        } mt-4`}>
          {isError ? (
            <AlertCircle className="h-4 w-4" />
          ) : isWarning ? (
            <AlertCircle className="h-4 w-4" />
          ) : isInfo ? (
            <Info className="h-4 w-4" />
          ) : (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          )}
          <p>{message}</p>
          
          {onRetry && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-6 px-2 text-xs"
              onClick={onRetry}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
        
        {additionalMessage && (
          <div className="mt-2 text-xs text-center text-muted-foreground">
            <p>{additionalMessage}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LoadingContent;
