
import React from 'react';
import { useStories } from '@/contexts/StoriesContext';
import StoryDetail from './StoryDetail';
import { ProjectContextData } from '@/types/jira';

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
