
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface LoadingContentProps {
  count?: number;
  titleWidth?: string;
  showTitle?: boolean;
  message?: string;
  isError?: boolean;
}

const LoadingContent: React.FC<LoadingContentProps> = ({ 
  count = 4, 
  titleWidth = "w-1/3",
  showTitle = true,
  message = "Loading content...",
  isError = false
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
        <p className={`text-center text-sm ${isError ? 'text-red-500' : 'text-muted-foreground'} mt-2`}>{message}</p>
      </div>
    </Card>
  );
};

export default LoadingContent;
