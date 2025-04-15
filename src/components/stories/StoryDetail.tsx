
import React from 'react';
import { JiraTicket, ProjectContextData } from '@/types/jira';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export interface StoryDetailProps {
  ticket: JiraTicket;
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryDetail: React.FC<StoryDetailProps> = ({ ticket, projectContext, selectedDocuments, projectContextData }) => {
  if (!ticket) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No ticket selected</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Ticket Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{ticket.key}: {ticket.summary}</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <p><span className="font-semibold">Type:</span> {ticket.issuetype?.name || 'Unknown'}</p>
              <p><span className="font-semibold">Status:</span> {ticket.status || 'Unknown'}</p>
              <p><span className="font-semibold">Priority:</span> {ticket.priority || 'Not set'}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-base">Description</h4>
            <div className="mt-2 text-sm prose prose-sm max-w-none">
              {ticket.description ? (
                <div dangerouslySetInnerHTML={{ __html: ticket.description }} />
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}
            </div>
          </div>
          
          {ticket.acceptance_criteria && (
            <div>
              <h4 className="font-semibold text-base">Acceptance Criteria</h4>
              <div className="mt-2 text-sm prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: ticket.acceptance_criteria }} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StoryDetail;
