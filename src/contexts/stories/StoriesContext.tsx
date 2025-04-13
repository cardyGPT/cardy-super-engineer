
import React, { createContext, useContext, ReactNode } from 'react';
import { StoriesContextType } from './types';
import { useStoriesState } from './useStoriesState';

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export const useStories = () => {
  const context = useContext(StoriesContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
};

export const StoriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const storiesState = useStoriesState();

  return (
    <StoriesContext.Provider value={storiesState}>
      {children}
    </StoriesContext.Provider>
  );
};

export default StoriesContext;
