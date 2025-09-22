import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

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
    // Configurar la URL base del backend
    const apiBaseURL = 'http://localhost:8000/api';
    
    this.client = axios.create({
      baseURL: apiBaseURL,
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
      (config) => {
        const token = localStorage.getItem('access_token');
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
    // Don't show toast errors for judicial consultation endpoints (public)
    const isJudicialConsultation = error.config?.url?.includes('/judicial/');
    
    if (error.response && !isJudicialConsultation) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;

        case 403:
          toast.error('You do not have permission to perform this action.');
          break;

        case 404:
          toast.error('Resource not found.');
          break;

        case 422:
          // Validation errors
          if (data?.errors && Array.isArray(data.errors)) {
            data.errors.forEach((errorMsg: string) => {
              toast.error(errorMsg);
            });
          } else {
            toast.error(data?.message || 'Validation error occurred.');
          }
          break;

        case 429:
          toast.error('Too many requests. Please try again later.');
          break;

        case 500:
          toast.error('Internal server error. Please try again later.');
          break;

        default:
          toast.error(data?.message || 'An unexpected error occurred.');
      }
    } else if (error.request && !isJudicialConsultation) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else if (!isJudicialConsultation) {
      // Something else happened
      toast.error('An unexpected error occurred.');
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
  async uploadFile<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

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

  // Download file method
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      });

      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename || 'download';
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      toast.error('Failed to download file');
      throw error;
    }
  }

  // Set authentication token
  setAuthToken(token: string) {
    localStorage.setItem('access_token', token);
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  // Clear authentication token
  clearAuthToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete this.client.defaults.headers.Authorization;
  }

  // Refresh token method
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await this.client.post('/auth/refresh-token', {
        refresh_token: refreshToken,
      });

      if (response.data.success) {
        const { access_token, refresh_token } = response.data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        this.setAuthToken(access_token);
        return true;
      }

      return false;
    } catch (error) {
      this.clearAuthToken();
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

export const companyAPI = {
  getCompany: () =>
    apiService.get('/companies/current'),
  
  updateCompany: (data: any) =>
    apiService.put('/companies/current', data),
  
  getCompanyUsers: (params?: any) =>
    apiService.get('/companies/users', params),
  
  inviteUser: (email: string, role: string) =>
    apiService.post('/companies/invite', { email, role }),
};

export const judicialAPI = {
  consultProcess: (numeroRadicacion: string, soloActivos?: boolean, refresh?: boolean) =>
    apiService.post('/judicial/consult' + (refresh ? '?refresh=true' : ''), { 
      numeroRadicacion, 
      soloActivos 
    }),
  
  searchProcesses: (query: string, params?: any) =>
    apiService.get('/judicial/search', { q: query, ...params }),
  
  getProcessActivities: (numeroRadicacion: string, params?: any) =>
    apiService.get(`/judicial/${numeroRadicacion}/activities`, params),
  
  getProcessSubjects: (numeroRadicacion: string, params?: any) =>
    apiService.get(`/judicial/${numeroRadicacion}/subjects`, params),
  
  getMonitoredProcesses: (params?: any) =>
    apiService.get('/judicial/monitored', params),
  
  monitorProcess: (numeroRadicacion: string) =>
    apiService.post('/judicial/monitor', { numeroRadicacion }),
};

export default apiService;