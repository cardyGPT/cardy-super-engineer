
import React from 'react';
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse, ProjectContextData } from '@/types/jira';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import ContentGenerationFlow from './ContentGenerationFlow';

interface StoryGenerateContentProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
  onGenerate: (request: JiraGenerationRequest) => Promise<JiraGenerationResponse | void>;
  onPushToJira: (ticketId: string, content: string) => Promise<boolean>;
  generatedContent: JiraGenerationResponse | null;
  isGenerating: boolean;
}

const StoryGenerateContent: React.FC<StoryGenerateContentProps> = ({
  ticket,
  projectContext,
  selectedDocuments,
  projectContextData,
  onGenerate,
  onPushToJira,
  generatedContent,
  isGenerating
}) => {
  const [currentStep, setCurrentStep] = React.useState<string>('lld');

  const handleGenerate = async (type: 'lld') => {
    setCurrentStep(type);
    
    const request: JiraGenerationRequest = {
      type,
      jiraTicket: ticket,
      projectContext: projectContext || undefined,
      selectedDocuments: selectedDocuments || [],
      additionalContext: {}
    };

    await onGenerate(request);
  };

  const handlePushToJira = async (content: string): Promise<boolean> => {
    return await onPushToJira(ticket.id, content);
  };

  const handleSaveContent = async (content: string): Promise<boolean> => {
    console.log('Saving content:', content);
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Ticket Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {ticket.key}: {ticket.summary}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticket.description && (
              <div>
                <h4 className="font-medium mb-2">Description:</h4>
                <p className="text-sm text-muted-foreground">{ticket.description}</p>
              </div>
            )}
            
            {ticket.acceptance_criteria && (
              <div>
                <h4 className="font-medium mb-2">Acceptance Criteria:</h4>
                <p className="text-sm text-muted-foreground">{ticket.acceptance_criteria}</p>
              </div>
            )}

            <div className="flex gap-4 text-sm">
              {ticket.status && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Status: {ticket.status}
                </span>
              )}
              {ticket.priority && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Priority: {ticket.priority}
                </span>
              )}
              {ticket.story_points && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  Story Points: {ticket.story_points}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Context Information */}
      {projectContextData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Using project context: <strong>{projectContextData.project.name}</strong>
            {projectContextData.documents.length > 0 && (
              <span> with {projectContextData.documents.length} reference document(s)</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Content Generation Flow */}
      <ContentGenerationFlow
        selectedTicket={ticket}
        generatedContent={generatedContent}
        isGenerating={isGenerating}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onGenerate={handleGenerate}
        onPushToJira={handlePushToJira}
        onSaveContent={handleSaveContent}
      />
    </div>
  );
};

export default StoryGenerateContent;
