
import React from 'react';
import { useStories } from '@/contexts/StoriesContext';
import StoryDetail from './StoryDetail';

interface StoryDetailWrapperProps {
  projectContext?: string | null;
  selectedDocuments?: string[];
}

const StoryDetailWrapper: React.FC<StoryDetailWrapperProps> = ({ 
  projectContext = null, 
  selectedDocuments = [] 
}) => {
  const { selectedTicket } = useStories();

  return (
    <StoryDetail 
      projectContext={projectContext} 
      selectedDocuments={selectedDocuments} 
    />
  );
};

export default StoryDetailWrapper;
