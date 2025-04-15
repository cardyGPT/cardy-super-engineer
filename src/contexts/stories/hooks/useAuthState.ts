
import { useState, useEffect } from 'react';
import { JiraCredentials } from '@/types/jira';

export const useAuthState = () => {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null);
  const [apiType, setApiType] = useState<'agile' | 'classic' | 'cloud'>('agile');
  const [error, setError] = useState<string | null>(null);

  // Load credentials from localStorage on initial mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('jira_credentials');
    const savedApiType = localStorage.getItem('jira_api_type');
    
    if (savedCredentials) {
      try {
        setCredentials(JSON.parse(savedCredentials));
      } catch (err) {
        console.error('Failed to parse saved credentials:', err);
      }
    }
    
    if (savedApiType && (savedApiType === 'agile' || savedApiType === 'classic' || savedApiType === 'cloud')) {
      setApiType(savedApiType as 'agile' | 'classic' | 'cloud');
    }
  }, []);

  // Save credentials to localStorage whenever they change
  useEffect(() => {
    if (credentials) {
      localStorage.setItem('jira_credentials', JSON.stringify(credentials));
    } else {
      localStorage.removeItem('jira_credentials');
    }
  }, [credentials]);

  // Save API type to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jira_api_type', apiType);
  }, [apiType]);

  return {
    credentials,
    setCredentials,
    isAuthenticated: !!credentials,
    apiType,
    setApiType,
    error,
    setError
  };
};
