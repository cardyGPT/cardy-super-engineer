
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { AlertCircle, LoaderCircle, Info } from "lucide-react";

interface LoadingContentProps {
  count?: number;
  titleWidth?: string;
  showTitle?: boolean;
  message?: string;
  isError?: boolean;
  isInfo?: boolean;
}

const LoadingContent: React.FC<LoadingContentProps> = ({ 
  count = 4, 
  titleWidth = "w-1/3",
  showTitle = true,
  message = "Loading content...",
  isError = false,
  isInfo = false
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
          isError ? 'text-red-500' : (isInfo ? 'text-blue-500' : 'text-muted-foreground')
        } mt-2`}>
          {isError ? (
            <AlertCircle className="h-4 w-4" />
          ) : isInfo ? (
            <Info className="h-4 w-4" />
          ) : (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          )}
          <p>{message}</p>
        </div>
      </div>
    </Card>
  );
};

export default LoadingContent;
