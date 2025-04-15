
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGitHub: () => Promise<boolean>;
  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('cardyUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('cardyUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // For demo purposes, we'll simulate a login
      if (email && password) {
        // In a real app, you would verify credentials with a backend
        const mockUser = {
          id: '123456',
          email,
          name: email.split('@')[0]
        };
        
        setUser(mockUser);
        localStorage.setItem('cardyUser', JSON.stringify(mockUser));
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        return true;
      }
      throw new Error('Invalid credentials');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simulate Google login
      const mockUser = {
        id: 'google-123456',
        email: 'user@example.com',
        name: 'Google User'
      };
      
      setUser(mockUser);
      localStorage.setItem('cardyUser', JSON.stringify(mockUser));
      
      toast({
        title: "Google login successful",
        description: "Welcome back!",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Google login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGitHub = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simulate GitHub login
      const mockUser = {
        id: 'github-123456',
        email: 'user@github.com',
        name: 'GitHub User'
      };
      
      setUser(mockUser);
      localStorage.setItem('cardyUser', JSON.stringify(mockUser));
      
      toast({
        title: "GitHub login successful",
        description: "Welcome back!",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "GitHub login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simulate sign up
      if (email && password) {
        const mockUser = {
          id: 'new-user-123',
          email,
          name: name || email.split('@')[0]
        };
        
        setUser(mockUser);
        localStorage.setItem('cardyUser', JSON.stringify(mockUser));
        
        toast({
          title: "Account created",
          description: "Welcome to Cardy Engineer!",
        });
        
        return true;
      }
      throw new Error('Invalid information');
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cardyUser');
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        loginWithGitHub,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
