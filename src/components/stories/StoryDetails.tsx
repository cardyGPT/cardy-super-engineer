
import React from 'react';
import { JiraTicket } from '@/types/jira';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StoryGenerateContent from './generate-content/StoryGenerateContent';
import StoryDetail from './StoryDetail';

interface StoryDetailsProps {
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: any; // This might be used for other purposes
}

const StoryDetails: React.FC<StoryDetailsProps> = ({ 
  projectContext, 
  selectedDocuments,
  projectContextData // Accepting but not using directly in props
}) => {
  const { 
    selectedTicket, 
    generatedContent,
    generateContent,
    pushToJira,
    contentLoading
  } = useStories();

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

export default StoryDetails;
