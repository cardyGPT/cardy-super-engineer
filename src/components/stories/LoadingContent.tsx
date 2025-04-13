
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingContentProps {
  count?: number;
  titleWidth?: string;
}

const LoadingContent: React.FC<LoadingContentProps> = ({ 
  count = 4, 
  titleWidth = "w-1/3" 
}) => {
  return (
    <div className="space-y-3">
      <Skeleton className={`h-8 ${titleWidth}`} />
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`h-4 w-${i % 2 === 0 ? 'full' : (i % 3 === 0 ? '2/3' : '3/4')}`} />
      ))}
    </div>
  );
};

export default LoadingContent;
