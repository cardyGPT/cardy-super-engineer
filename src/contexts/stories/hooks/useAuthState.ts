
import { useState, useEffect } from 'react';
import { JiraCredentials } from '@/types/jira';

export const useAuthState = () => {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load credentials from localStorage on mount
  useEffect(() => {
    const loadCredentials = () => {
      try {
        const savedCreds = localStorage.getItem('jira_credentials');
        if (savedCreds) {
          const parsedCreds = JSON.parse(savedCreds) as JiraCredentials;
          
          // Validate the credentials format
          if (parsedCreds.domain && parsedCreds.email && parsedCreds.apiToken) {
            // Clean up domain - ensure it has no trailing slashes and is properly formatted
            const cleanDomain = parsedCreds.domain.replace(/\/+$/, '');
            
            // Save the cleaned credentials
            const cleanedCreds = {
              ...parsedCreds,
              domain: cleanDomain
            };
            
            setCredentials(cleanedCreds);
            setIsAuthenticated(true);
            console.log("Loaded valid Jira credentials from localStorage");
            
            // Log the detected auth type based on token format (for debugging purposes)
            if (parsedCreds.apiToken.length > 50) {
              console.log("Detected PAT token format (long token)");
            } else {
              console.log("Detected Classic API token format (shorter token)");
            }
          } else {
            console.log("Invalid credentials format in localStorage, removing");
            localStorage.removeItem('jira_credentials');
            setError("Invalid credentials format");
          }
        } else {
          console.log("No Jira credentials found in localStorage");
        }
      } catch (err) {
        console.error('Error loading Jira credentials:', err);
        localStorage.removeItem('jira_credentials');
        setError("Error parsing stored credentials");
      }
    };

    loadCredentials();
  }, []);

  // Update localStorage when credentials change
  useEffect(() => {
    if (credentials) {
      try {
        // Ensure domain doesn't have trailing slashes and is properly formatted
        const cleanCredentials = {
          ...credentials,
          domain: credentials.domain.replace(/\/+$/, '')
        };
        
        localStorage.setItem('jira_credentials', JSON.stringify(cleanCredentials));
        setIsAuthenticated(true);
        setError(null);
        console.log("Saved Jira credentials to localStorage");
      } catch (err) {
        console.error('Error saving credentials to localStorage:', err);
        setError("Error saving credentials");
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
    isAuthenticated,
    error
  };
};
