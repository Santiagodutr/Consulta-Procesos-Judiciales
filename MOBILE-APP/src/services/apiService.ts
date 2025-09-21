import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error: AxiosError<ApiResponse>) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError<ApiResponse>) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and show alert
          SecureStore.deleteItemAsync('access_token');
          SecureStore.deleteItemAsync('refresh_token');
          Alert.alert('Session Expired', 'Please login again.', [
            { text: 'OK', onPress: () => {} }
          ]);
          break;

        case 403:
          Alert.alert('Access Denied', 'You do not have permission to perform this action.');
          break;

        case 404:
          Alert.alert('Not Found', 'Resource not found.');
          break;

        case 422:
          // Validation errors
          if (data?.errors && Array.isArray(data.errors)) {
            const errorMessage = data.errors.join('\n');
            Alert.alert('Validation Error', errorMessage);
          } else {
            Alert.alert('Validation Error', data?.message || 'Validation error occurred.');
          }
          break;

        case 429:
          Alert.alert('Rate Limited', 'Too many requests. Please try again later.');
          break;

        case 500:
          Alert.alert('Server Error', 'Internal server error. Please try again later.');
          break;

        default:
          Alert.alert('Error', data?.message || 'An unexpected error occurred.');
      }
    } else if (error.request) {
      // Network error
      Alert.alert('Network Error', 'Please check your internet connection.');
    } else {
      // Something else happened
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  }

  // Generic HTTP methods
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url);
    return response.data;
  }

  // File upload method
  async uploadFile<T = any>(
    url: string, 
    uri: string, 
    type: string = 'image/jpeg',
    name: string = 'file',
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    
    formData.append('file', {
      uri,
      type,
      name,
    } as any);

    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Set authentication token
  async setAuthToken(token: string) {
    try {
      await SecureStore.setItemAsync('access_token', token);
      this.client.defaults.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  // Clear authentication token
  async clearAuthToken() {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      delete this.client.defaults.headers.Authorization;
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  }

  // Refresh token method
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await this.client.post('/auth/refresh-token', {
        refresh_token: refreshToken,
      });

      if (response.data.success) {
        const { access_token, refresh_token } = response.data.data;
        await SecureStore.setItemAsync('access_token', access_token);
        await SecureStore.setItemAsync('refresh_token', refresh_token);
        await this.setAuthToken(access_token);
        return true;
      }

      return false;
    } catch (error) {
      await this.clearAuthToken();
      return false;
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export specific API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    apiService.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    apiService.post('/auth/register', userData),
  
  logout: () =>
    apiService.post('/auth/logout'),
  
  forgotPassword: (email: string) =>
    apiService.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    apiService.post('/auth/reset-password', { token, new_password: password }),
  
  verifyEmail: (token: string) =>
    apiService.get(`/auth/verify-email/${token}`),
  
  getProfile: () =>
    apiService.get('/auth/profile'),
  
  updateProfile: (data: any) =>
    apiService.put('/auth/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    apiService.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
};

export const processAPI = {
  getProcesses: (params?: any) =>
    apiService.get('/processes', params),
  
  getProcess: (processId: string) =>
    apiService.get(`/processes/${processId}`),
  
  createProcess: (processData: any) =>
    apiService.post('/processes', processData),
  
  updateProcess: (processId: string, data: any) =>
    apiService.put(`/processes/${processId}`, data),
  
  deleteProcess: (processId: string) =>
    apiService.delete(`/processes/${processId}`),
  
  getProcessActivities: (processId: string, params?: any) =>
    apiService.get(`/processes/${processId}/activities`, params),
  
  getProcessDocuments: (processId: string, params?: any) =>
    apiService.get(`/processes/${processId}/documents`, params),
  
  shareProcess: (processId: string, data: any) =>
    apiService.post(`/processes/${processId}/share`, data),
  
  unshareProcess: (processId: string, userId: string) =>
    apiService.delete(`/processes/${processId}/share/${userId}`),
  
  updateMonitoring: (processId: string, isMonitored: boolean) =>
    apiService.patch(`/processes/${processId}/monitoring`, { is_monitored: isMonitored }),
  
  scrapeProcess: (processId: string) =>
    apiService.post(`/processes/${processId}/scrape`),
};

export const notificationAPI = {
  getNotifications: (params?: any) =>
    apiService.get('/notifications', params),
  
  markAsRead: (notificationId: string) =>
    apiService.patch(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () =>
    apiService.patch('/notifications/mark-all-read'),
  
  getUnreadCount: () =>
    apiService.get('/notifications/unread-count'),
};

export const analyticsAPI = {
  getProcessStatistics: () =>
    apiService.get('/analytics/process-statistics'),
  
  getActivityChart: (params?: any) =>
    apiService.get('/analytics/activity-chart', params),
  
  getProcessTypeChart: () =>
    apiService.get('/analytics/process-type-chart'),
};

export default apiService;