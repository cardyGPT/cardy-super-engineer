
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
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: any; // This might be used for other purposes
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const StoryDetails: React.FC<StoryDetailsProps> = ({ 
  ticket,
  projectContext, 
  selectedDocuments,
  projectContextData,
  activeTab = "details",
  setActiveTab = () => {}
}) => {
  const { 
    generatedContent,
    generateContent,
    pushToJira,
    contentLoading
  } = useStories();

  if (!ticket) {
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
      ticket={ticket}
      projectContext={projectContext} 
      selectedDocuments={selectedDocuments}
      projectContextData={projectContextData}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
};

export default StoryDetails;
