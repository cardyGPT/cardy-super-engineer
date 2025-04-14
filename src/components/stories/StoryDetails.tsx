
import React, { useState, useEffect } from "react";
import { useStories } from "@/contexts/StoriesContext";
import { ProjectContextData } from "@/types/jira";
import StoryDetailWrapper from "./StoryDetailWrapper";

interface StoryDetailsProps {
  projectContext?: string | null;
  selectedDocuments?: string[];
  projectContextData?: ProjectContextData | null;
}

const StoryDetails: React.FC<StoryDetailsProps> = ({ 
  projectContext, 
  selectedDocuments = [],
  projectContextData = null
}) => {
  return (
    <StoryDetailWrapper 
      projectContext={projectContext} 
      selectedDocuments={selectedDocuments}
      projectContextData={projectContextData}
    />
  );
};

export default StoryDetails;
