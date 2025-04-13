
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingContent: React.FC = () => {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
};

export default LoadingContent;
