
import { useState, useEffect } from 'react';
import { JiraCredentials } from '@/types/jira';
import { testJiraConnection } from '../api';

export const useAuthState = () => {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored credentials in localStorage on initial load
    const storedCredentials = localStorage.getItem('jira_credentials');
    if (storedCredentials) {
      try {
        const parsed = JSON.parse(storedCredentials);
        setCredentials(parsed);
        // Validate credentials
        testJiraConnection(parsed)
          .then(() => {
            setIsAuthenticated(true);
            setError(null);
          })
          .catch(err => {
            console.error('Error validating stored credentials:', err);
            setIsAuthenticated(false);
            setError('Stored credentials are invalid');
            // Clear invalid credentials
            localStorage.removeItem('jira_credentials');
            setCredentials(null);
          });
      } catch (err) {
        console.error('Error parsing stored credentials:', err);
        localStorage.removeItem('jira_credentials');
      }
    }
  }, []);

  // Update authentication state whenever credentials change
  useEffect(() => {
    if (!credentials) {
      setIsAuthenticated(false);
      return;
    }

    // Store credentials
    localStorage.setItem('jira_credentials', JSON.stringify(credentials));
    
    // Validate Jira connection
    testJiraConnection(credentials)
      .then(() => {
        setIsAuthenticated(true);
        setError(null);
      })
      .catch(err => {
        console.error('Error validating credentials:', err);
        setIsAuthenticated(false);
        setError(err.message || 'Failed to authenticate with Jira');
      });
  }, [credentials]);

  const setCredentialsWithAuth = (newCredentials: JiraCredentials | null) => {
    setCredentials(newCredentials);
    
    // If null, clear authentication
    if (!newCredentials) {
      setIsAuthenticated(false);
      localStorage.removeItem('jira_credentials');
    }
  };

  return {
    credentials,
    setCredentials: setCredentialsWithAuth,
    isAuthenticated,
    error
  };
};
