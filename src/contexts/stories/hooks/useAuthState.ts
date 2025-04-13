
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
          
          // Validate the credentials format
          if (parsedCreds.domain && parsedCreds.email && parsedCreds.apiToken) {
            setCredentials(parsedCreds);
            setIsAuthenticated(true);
            console.log("Loaded valid Jira credentials from localStorage");
          } else {
            console.log("Invalid credentials format in localStorage, removing");
            localStorage.removeItem('jira_credentials');
          }
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
      try {
        // Ensure domain doesn't have trailing slashes
        const cleanCredentials = {
          ...credentials,
          domain: credentials.domain.replace(/\/+$/, '')
        };
        
        localStorage.setItem('jira_credentials', JSON.stringify(cleanCredentials));
        setIsAuthenticated(true);
        console.log("Saved Jira credentials to localStorage");
      } catch (err) {
        console.error('Error saving credentials to localStorage:', err);
      }
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
