
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Edit } from "lucide-react";
import { ProjectContextData } from "@/types/jira";

interface ContextBannerProps {
  contextData: ProjectContextData;
  onEdit: () => void;
}

const ContextBanner: React.FC<ContextBannerProps> = ({ contextData, onEdit }) => {
  return (
    <Card className="mb-4 bg-muted/30">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Database className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-sm font-medium mr-3">Context:</span>
          
          <div className="flex flex-wrap gap-1 items-center">
            <Badge variant="outline" className="bg-white dark:bg-slate-800">
              {contextData.project.name}
            </Badge>
            
            {contextData.documents.length > 0 && (
              <>
                <span className="text-muted-foreground text-xs mx-1">+</span>
                <Badge 
                  variant="outline" 
                  className="bg-white dark:bg-slate-800"
                >
                  {contextData.documents.length} {contextData.documents.length === 1 ? 'document' : 'documents'}
                </Badge>
              </>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 text-xs"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContextBanner;
