
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Sliders } from "lucide-react";
import { ProjectContextData } from "@/types/jira";

interface JiraContextProps {
  contextData: ProjectContextData;
  onEdit: () => void;
}

const JiraContext: React.FC<JiraContextProps> = ({ contextData, onEdit }) => {
  if (!contextData) return null;
  
  return (
    <div className="mb-4">
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-4 w-4 mr-2 text-primary" />
              <span className="font-medium">Context:</span>
              <span className="ml-2">{contextData.project.name} ({contextData.project.type})</span>
              {contextData.documents.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {contextData.documents.length} document{contextData.documents.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit}
            >
              <Sliders className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JiraContext;
