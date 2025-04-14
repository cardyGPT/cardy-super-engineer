
import React from 'react';
import { JiraTicket } from '@/types/jira';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import StoryGenerateContent from './StoryGenerateContent';

interface StoryDetailsProps {
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: any; // This might be used for other purposes
}

const StoryDetails: React.FC<StoryDetailsProps> = ({ 
  projectContext, 
  selectedDocuments,
  projectContextData // Accepting but not passing to StoryGenerateContent
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>
              {selectedTicket.key}: {selectedTicket.summary}
            </span>
            {selectedTicket.issuetype && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {selectedTicket.issuetype.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <div className="text-sm bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                {selectedTicket.description || 'No description available'}
              </div>
            </div>

            {selectedTicket.acceptance_criteria && (
              <div>
                <h3 className="font-medium mb-2">Acceptance Criteria</h3>
                <div className="text-sm bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                  {selectedTicket.acceptance_criteria}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <StoryGenerateContent
        ticket={selectedTicket}
        projectContext={projectContext}
        selectedDocuments={selectedDocuments}
        onGenerate={generateContent}
        onPushToJira={pushToJira}
        generatedContent={generatedContent}
        isGenerating={contentLoading}
      />
    </div>
  );
};

export default StoryDetails;
