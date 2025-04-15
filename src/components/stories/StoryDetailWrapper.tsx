
import React from 'react';
import { useStories } from '@/contexts/stories';
import StoryDetail from './StoryDetail';
import { ProjectContextData } from '@/types/jira';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface StoryDetailWrapperProps {
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryDetailWrapper: React.FC<StoryDetailWrapperProps> = ({ 
  projectContext = null, 
  selectedDocuments = [],
  projectContextData = null
}) => {
  const { selectedTicket } = useStories();

  if (!selectedTicket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Story Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Select a story to view details
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <StoryDetail 
      ticket={selectedTicket}
      projectContext={projectContext} 
      selectedDocuments={selectedDocuments}
      projectContextData={projectContextData}
    />
  );
};

export default StoryDetailWrapper;
