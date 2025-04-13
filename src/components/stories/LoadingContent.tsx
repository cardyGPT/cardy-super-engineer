
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingContentProps {
  count?: number;
  titleWidth?: string;
  showTitle?: boolean;
}

const LoadingContent: React.FC<LoadingContentProps> = ({ 
  count = 4, 
  titleWidth = "w-1/3",
  showTitle = true
}) => {
  return (
    <div className="space-y-3">
      {showTitle && <Skeleton className={`h-8 ${titleWidth}`} />}
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i % 2 === 0 ? 'w-full' : (i % 3 === 0 ? 'w-2/3' : 'w-3/4')}`} 
        />
      ))}
    </div>
  );
};

export default LoadingContent;
