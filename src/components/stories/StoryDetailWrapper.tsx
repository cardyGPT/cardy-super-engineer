
import React, { useState } from 'react';
import { useStories } from '@/contexts/StoriesContext';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import StoryDetails from './StoryDetails';

interface StoryDetailWrapperProps {
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: any;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const StoryDetailWrapper: React.FC<StoryDetailWrapperProps> = ({ 
  projectContext, 
  selectedDocuments,
  projectContextData,
  activeTab = "details",
  setActiveTab = () => {}
}) => {
  const { selectedTicket } = useStories();
  
  if (!selectedTicket) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Ticket Selected</h3>
          <AlertDescription className="text-gray-500">
            Select a ticket from the list on the left to view its details and generate content
          </AlertDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <StoryDetails 
      ticket={selectedTicket}
      projectContext={projectContext} 
      selectedDocuments={selectedDocuments}
      projectContextData={projectContextData}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
};

export default StoryDetailWrapper;
