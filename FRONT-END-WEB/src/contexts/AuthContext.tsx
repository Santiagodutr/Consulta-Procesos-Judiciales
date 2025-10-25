import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService } from '../services/apiService.ts';

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
    console.log('AuthContext: Checking existing session...');
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      
      if (token) {
        apiService.setAuthToken(token);

        let parsedUser: AuthUser | null = null;

        if (userData) {
          try {
            parsedUser = JSON.parse(userData);
            if (parsedUser) {
              console.log('AuthContext: User loaded from localStorage:', parsedUser.email);
              setUser(parsedUser);
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            localStorage.removeItem('user');
          }
        }

        try {
          const profileResponse = await apiService.get<AuthUser>('/auth/profile');
          if (profileResponse.success && profileResponse.data) {
            console.log('AuthContext: User refreshed from /auth/profile');
            setUser(profileResponse.data);
            localStorage.setItem('user', JSON.stringify(profileResponse.data));
          }
        } catch (profileError) {
          console.warn('AuthContext: Unable to refresh profile on load:', profileError);
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } finally {
      console.log('AuthContext: Session check completed. Loading set to false.');
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: SignIn started for:', email);
    setLoading(true);
    try {
      const response = await apiService.post('/auth/login', {
        email,
        password,
      });

      console.log('AuthContext: Login response:', response.success);

      if (response.success && response.data) {
        const authData = response.data;
        
        console.log('AuthContext: Auth data structure:', authData);
        console.log('AuthContext: User object:', authData.user);
        console.log('AuthContext: Storing user data for:', authData.user?.email);
        
        // Store tokens
        localStorage.setItem('access_token', authData.access_token);
        localStorage.setItem('refresh_token', authData.refresh_token);
        
        // Set token in API service
        apiService.setAuthToken(authData.access_token);
        
        // Si no hay datos de usuario en la respuesta, crear un usuario básico o obtenerlo del server
        if (authData.user) {
          localStorage.setItem('user', JSON.stringify(authData.user));
          setUser(authData.user as AuthUser);
          console.log('AuthContext: User data stored from login response');
        } else {
          console.log('AuthContext: No user data in login response, fetching profile');
          const profileResponse = await apiService.get<AuthUser>('/auth/profile');
          if (profileResponse.success && profileResponse.data) {
            localStorage.setItem('user', JSON.stringify(profileResponse.data));
            setUser(profileResponse.data);
            console.log('AuthContext: User data loaded from /auth/profile');
          } else {
            console.warn('AuthContext: Profile endpoint did not return user data, using placeholder');
            const fallbackUser: AuthUser = {
              id: 'temp-id',
              email,
              first_name: 'Usuario',
              last_name: 'Temporal',
              document_number: '',
              document_type: 'CC',
              user_type: 'natural',
              is_active: true,
              email_verified: true,
              notification_preferences: {
                email_enabled: true,
                sms_enabled: false,
                in_app_enabled: true,
                sound_enabled: true,
                process_updates: true,
                hearing_reminders: true,
                document_alerts: true,
                weekly_summary: false,
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            localStorage.setItem('user', JSON.stringify(fallbackUser));
            setUser(fallbackUser);
          }
        }
        
        console.log('AuthContext: User state updated successfully');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('AuthContext: SignIn error:', error);
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
      localStorage.removeItem('user');
      apiService.clearAuthToken();
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfile = async (updateData: Partial<AuthUser>) => {
    if (!user) return;

    try {
      const response = await apiService.put('/auth/profile', updateData);
      
      if (response.success && response.data) {
        const updatedUser = {
          ...user,
          ...response.data,
        } as AuthUser;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Profile update failed');
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const response = await apiService.get<AuthUser>('/auth/profile');
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
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