import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { apiService } from '../services/apiService';

interface AuthUser extends User {
  first_name?: string;
  last_name?: string;
  document_number?: string;
  document_type?: string;
  user_type?: 'natural' | 'juridical' | 'company';
  phone_number?: string;
  company_id?: string;
  is_active?: boolean;
  email_verified?: boolean;
  notification_preferences?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  document_number: string;
  document_type: string;
  user_type: 'natural' | 'juridical' | 'company';
  phone_number?: string;
  company_id?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabase: SupabaseClient = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const profile = await apiService.get(`/users/${authUser.id}`);
      setUser({
        ...authUser,
        ...profile.data,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(authUser as AuthUser);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (signUpData: SignUpData) => {
    setLoading(true);
    try {
      // Use your API endpoint for registration
      const response = await apiService.post('/auth/register', signUpData);
      
      if (response.data.success) {
        // The user will need to verify their email
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await apiService.post('/auth/logout');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updateData: Partial<AuthUser>) => {
    if (!user) return;

    try {
      const response = await apiService.put('/auth/profile', updateData);
      
      if (response.data.success) {
        setUser({
          ...user,
          ...response.data.data,
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      await loadUserProfile(user);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { supabase };