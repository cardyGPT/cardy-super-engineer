
import React, { createContext, useContext, ReactNode } from 'react';
import { useStoriesState } from './useStoriesState';
import { JiraCredentials, JiraProject, JiraSprint, JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';
import { ContentType } from '@/components/stories/ContentDisplay';

// Create the context with appropriate typing
const StoriesContext = createContext<ReturnType<typeof useStoriesState> | undefined>(undefined);

// Custom hook for accessing the context
export const useStories = () => {
  const context = useContext(StoriesContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
};

// Provider component
export const StoriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storiesState = useStoriesState();

  return (
    <StoriesContext.Provider value={storiesState}>
      {children}
    </StoriesContext.Provider>
  );
};

export default StoriesContext;
