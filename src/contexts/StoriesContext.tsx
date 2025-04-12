
import React, { createContext, useState, useContext, useEffect } from "react";
import { JiraCredentials, StoriesContextType } from "@/types/jira";

const defaultContext: StoriesContextType = {
  credentials: null,
  setCredentials: () => {},
  isAuthenticated: false,
  tickets: [],
  loading: false,
  error: null,
  fetchTickets: async () => {},
  selectedTicket: null,
  setSelectedTicket: () => {},
  generatedContent: null,
  generateContent: async () => {},
  pushToJira: async () => false
};

const StoriesContext = createContext<StoriesContextType>(defaultContext);

export const useStories = () => useContext(StoriesContext);

export const StoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credentials, setCredentials] = useState<JiraCredentials | null>(
    JSON.parse(localStorage.getItem("jira_credentials") || "null")
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAuthenticated = !!credentials;

  // Save credentials to localStorage whenever they change
  useEffect(() => {
    if (credentials) {
      localStorage.setItem("jira_credentials", JSON.stringify(credentials));
    } else {
      localStorage.removeItem("jira_credentials");
    }
  }, [credentials]);

  // Simple placeholder functions for now, will be implemented later
  const fetchTickets = async () => {
    console.log("fetchTickets will be implemented next");
  };

  const generateContent = async () => {
    console.log("generateContent will be implemented later");
  };

  const pushToJira = async () => {
    console.log("pushToJira will be implemented later");
    return false;
  };

  const value = {
    credentials,
    setCredentials,
    isAuthenticated,
    tickets: [],
    loading,
    error,
    fetchTickets,
    selectedTicket: null,
    setSelectedTicket: () => {},
    generatedContent: null,
    generateContent,
    pushToJira
  };

  return (
    <StoriesContext.Provider value={value}>
      {children}
    </StoriesContext.Provider>
  );
};
