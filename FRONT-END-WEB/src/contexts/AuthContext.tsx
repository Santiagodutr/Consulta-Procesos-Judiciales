import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  document_number: string;
  document_type: string;
  user_type: 'natural' | 'juridical' | 'company';
  phone_number?: string;
  company_id?: string;
  is_active: boolean;
  email_verified: boolean;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  sound_enabled: boolean;
  process_updates: boolean;
  hearing_reminders: boolean;
  document_alerts: boolean;
  weekly_summary: boolean;
}

interface AuthResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  document_number: string;
  document_type: 'CC' | 'CE' | 'NIT' | 'passport';
  user_type: 'natural' | 'juridical' | 'company';
  phone_number?: string;
  company_id?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Set the token in API service
        apiService.setAuthToken(token);
        
        // Try to get user profile
        const response = await apiService.get('/auth/profile');
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          // Token invalid, remove it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiService.post('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        const authData: AuthResponse = response.data.data;
        
        // Store tokens
        localStorage.setItem('access_token', authData.access_token);
        localStorage.setItem('refresh_token', authData.refresh_token);
        
        // Set token in API service
        apiService.setAuthToken(authData.access_token);
        
        // Set user
        setUser(authData.user);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (signUpData: SignUpData) => {
    setLoading(true);
    try {
      const response = await apiService.post('/auth/register', signUpData);
      
      if (response.data.success) {
        // Registration successful, user needs to verify email
        return response.data.message;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Try to logout on server
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Error during server logout:', error);
    } finally {
      // Clear local data regardless
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      apiService.clearAuthToken();
      setUser(null);
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
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Profile update failed');
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const response = await apiService.get('/auth/profile');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiService.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Password change failed');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await apiService.post('/auth/forgot-password', { email });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Password reset request failed');
      }
      
      return response.data.message;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Password reset request failed');
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await apiService.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Password reset failed');
      }
      
      return response.data.message;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Password reset failed');
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshUser,
    changePassword,
    forgotPassword,
    resetPassword,
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