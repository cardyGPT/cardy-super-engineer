
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { User, Session, AuthError } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  email_notifications: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  preferences: UserPreferences | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGitHub: () => Promise<boolean>;
  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Function to fetch profile and preferences
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (preferencesError) {
        console.error('Error fetching preferences:', preferencesError);
      } else if (preferencesData) {
        setPreferences(preferencesData as UserPreferences);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Set up auth state listener
  useEffect(() => {
    setIsLoading(true);

    // Set up Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to prevent potential deadlocks
          setTimeout(() => {
            fetchUserData(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setPreferences(null);
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setPreferences(null);
          setSession(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchUserData(currentSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        return true;
      }
      
      return false;
    } catch (error: any) {
      const errorMessage = (error as AuthError).message || "Failed to sign in";
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      const errorMessage = (error as AuthError).message || "Google login failed";
      toast({
        title: "Google login failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with GitHub
  const loginWithGitHub = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      const errorMessage = (error as AuthError).message || "GitHub login failed";
      toast({
        title: "GitHub login failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: "Account created",
          description: "Welcome to Cardy Engineer!",
        });
        return true;
      }
      
      return false;
    } catch (error: any) {
      const errorMessage = (error as AuthError).message || "Failed to sign up";
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Send password reset email
  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for instructions to reset your password",
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = (error as AuthError).message || "Failed to send reset email";
      toast({
        title: "Failed to send reset email",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = (error as AuthError).message || "Failed to reset password";
      toast({
        title: "Failed to reset password",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user preferences
  const updatePreferences = async (updates: Partial<UserPreferences>): Promise<boolean> => {
    try {
      if (!user || !preferences) {
        throw new Error('No user logged in or preferences not loaded');
      }

      setIsLoading(true);
      
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Preferences updated",
        description: "Your preferences have been successfully updated",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to update preferences",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      
      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        preferences,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        loginWithGitHub,
        signUp,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        updatePreferences
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
