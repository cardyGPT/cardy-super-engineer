
import { useState, useEffect } from 'react';
import { JiraCredentials } from '@/types/jira';

export const useAuthState = () => {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load credentials from localStorage on mount
  useEffect(() => {
    const loadCredentials = () => {
      try {
        const savedCreds = localStorage.getItem('jira_credentials');
        if (savedCreds) {
          const parsedCreds = JSON.parse(savedCreds) as JiraCredentials;
          setCredentials(parsedCreds);
          setIsAuthenticated(true);
          console.log("Loaded Jira credentials from localStorage");
        } else {
          console.log("No Jira credentials found in localStorage");
        }
      } catch (err) {
        console.error('Error loading Jira credentials:', err);
        localStorage.removeItem('jira_credentials');
      }
    };

    loadCredentials();
  }, []);

  // Update localStorage when credentials change
  useEffect(() => {
    if (credentials) {
      localStorage.setItem('jira_credentials', JSON.stringify(credentials));
      setIsAuthenticated(true);
      console.log("Saved Jira credentials to localStorage");
    } else {
      localStorage.removeItem('jira_credentials');
      setIsAuthenticated(false);
      console.log("Removed Jira credentials from localStorage");
    }
  }, [credentials]);

  return {
    credentials,
    setCredentials,
    isAuthenticated
  };
};
