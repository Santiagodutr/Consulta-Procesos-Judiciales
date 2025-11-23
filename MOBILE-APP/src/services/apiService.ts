import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

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
    const envUrl = process.env.EXPO_PUBLIC_API_URL;

    // Default backend host/port used by Spring Boot
    const backendHost = (() => {
      // If user provided EXPO_PUBLIC_API_URL use it
      if (envUrl && envUrl.trim().length > 0) return envUrl.replace(/\/$/, '');

      // On Android emulator, localhost -> 10.0.2.2
      if (Platform.OS === 'android') return 'http://10.0.2.2:8080/api';

      // On iOS simulator / web, localhost works
      return 'http://localhost:8080/api';
    })();

    this.client = axios.create({
      baseURL: backendHost,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Small debug hint
    console.debug('[apiService] baseURL =', backendHost);

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
      console.error('[apiService] Network error details:', error.message, error.config);
      Alert.alert('Network Error', 'Please check your internet connection.');
    } else {
      // Something else happened
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  }

  // Helper to override baseURL at runtime (useful for debugging on devices)
  setBaseURL(url: string) {
    if (!url) return;
    this.client.defaults.baseURL = url.replace(/\/$/, '');
    console.debug('[apiService] baseURL overridden ->', this.client.defaults.baseURL);
  }

  // Generic HTTP methods
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    console.debug('[apiService] GET', url, params, '->', this.client.defaults.baseURL);
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    console.debug('[apiService] POST', url, data, '->', this.client.defaults.baseURL);
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    console.debug('[apiService] PUT', url, data, '->', this.client.defaults.baseURL);
    const response = await this.client.put(url, data);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    console.debug('[apiService] PATCH', url, data, '->', this.client.defaults.baseURL);
    const response = await this.client.patch(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    console.debug('[apiService] DELETE', url, '->', this.client.defaults.baseURL);
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
  // Temporarily stubbed to avoid backend calls while notifications are removed from mobile
  getNotifications: async (params?: any) => {
    return { success: true, data: [] } as any;
  },

  markAsRead: async (notificationId: string) => {
    return { success: true } as any;
  },

  markAllAsRead: async () => {
    return { success: true } as any;
  },

  getUnreadCount: async () => {
    return { success: true, data: 0 } as any;
  },
};

export const analyticsAPI = {
  getProcessStatistics: () =>
    apiService.get('/analytics/process-statistics'),
  
  getActivityChart: (params?: any) =>
    apiService.get('/analytics/activity-chart', params),
  
  getProcessTypeChart: () =>
    apiService.get('/analytics/process-type-chart'),
};

// Judicial endpoints (proxy through backend to portal when needed)
export const judicialAPI = {
  consultProcess: async (numeroRadicacion: string, soloActivos?: boolean, refresh?: boolean) => {
    console.log('🔍 [judicialAPI] consultProcess llamado:', { numeroRadicacion, soloActivos, refresh });
    const result = await apiService.post('/judicial/consult' + (refresh ? '?refresh=true' : ''), { numeroRadicacion, soloActivos });
    console.log('📦 [judicialAPI] consultProcess respuesta:', {
      success: result?.success,
      hasData: !!result?.data,
      idProceso: result?.data?.idProceso,
      dataKeys: result?.data ? Object.keys(result.data) : []
    });
    return result;
  },

  searchProcesses: (query: string, params?: any) =>
    apiService.get('/judicial/search', { q: query, ...params }),

  getProcessActivities: (numeroRadicacion: string, params?: any) =>
    apiService.get(`/judicial/${numeroRadicacion}/activities`, params),

  getProcessSubjects: (numeroRadicacion: string, params?: any) =>
    apiService.get(`/judicial/${numeroRadicacion}/subjects`, params),

  getConsultationHistory: (limit?: number) =>
    apiService.get('/judicial/consultation-history', { limit: limit || 10 }),

  getMonitoredProcesses: (params?: any) =>
    apiService.get('/judicial/monitored', params),

  monitorProcess: (numeroRadicacion: string) =>
    apiService.post('/judicial/monitor', { numeroRadicacion }),

  // Favorites
  saveFavoriteProcess: (processData: any) =>
    apiService.post('/judicial/processes/favorites', processData),

  removeFavoriteProcess: (numeroRadicacion: string) =>
    apiService.delete(`/judicial/processes/favorites/${numeroRadicacion}`),

  getFavoriteProcesses: () =>
    apiService.get('/judicial/processes/favorites'),

  checkIfFavorite: (numeroRadicacion: string) =>
    apiService.get(`/judicial/processes/favorites/check/${numeroRadicacion}`),
};

// Portal Judicial API - Consultas directas al portal oficial
// Estos métodos consultan directamente al portal judicial, NO a la base de datos
const PORTAL_BASE_URL = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2';

const portalClient = axios.create({
  baseURL: PORTAL_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

export const judicialPortalAPI = {
  // Obtener detalles del proceso por idProceso
  // API: https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Detalle/{idProceso}
  getProcessByIdProceso: async (idProceso: number) => {
    try {
      console.log(`[Portal] Consultando detalles del proceso ID: ${idProceso}`);
      const response = await portalClient.get(`/Proceso/Detalle/${idProceso}`);
      console.log(`[Portal] Detalles recibidos:`, response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[Portal] Error fetching process details:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al consultar el proceso',
        data: null 
      };
    }
  },

  // Obtener sujetos procesales por idProceso
  // API: https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Sujetos/{idProceso}?pagina=1
  getSujetosByIdProceso: async (idProceso: number, pagina: number = 1) => {
    try {
      console.log(`[Portal] Consultando sujetos del proceso ID: ${idProceso}, página: ${pagina}`);
      const response = await portalClient.get(`/Proceso/Sujetos/${idProceso}`, {
        params: { pagina }
      });
      console.log(`[Portal] Sujetos recibidos:`, response.data);
      
      // La API devuelve { sujetos: [...], paginacion: {...} }
      if (response.data && Array.isArray(response.data.sujetos)) {
        return { success: true, data: response.data.sujetos };
      }
      
      // Si viene directamente el array
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: [] };
    } catch (error: any) {
      console.error('[Portal] Error fetching subjects:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al consultar los sujetos',
        data: [] 
      };
    }
  },

  // Obtener actuaciones por idProceso con paginación
  // API: https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/{idProceso}?pagina=1
  getActuacionesByIdProceso: async (idProceso: number, pagina: number = 1) => {
    try {
      console.log(`[Portal] Consultando actuaciones del proceso ID: ${idProceso}, página: ${pagina}`);
      const response = await portalClient.get(`/Proceso/Actuaciones/${idProceso}`, {
        params: { pagina }
      });
      console.log(`[Portal] Actuaciones recibidas:`, response.data);
      
      const data = response.data;
      
      // Extraer actuaciones de diferentes formatos de respuesta
      if (data && Array.isArray(data.actuaciones)) {
        return { success: true, data: data };
      } else if (Array.isArray(data)) {
        return { success: true, data: { actuaciones: data, paginacion: null } };
      } else if (data && data.lsData && Array.isArray(data.lsData)) {
        return { success: true, data: { actuaciones: data.lsData, paginacion: null } };
      }
      
      return { success: true, data: { actuaciones: [], paginacion: null } };
    } catch (error: any) {
      console.error('[Portal] Error fetching activities:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al consultar las actuaciones',
        data: { actuaciones: [], paginacion: null } 
      };
    }
  },

  // Obtener documentos por idProceso
  // API: https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Documentos/{idProceso}
  getDocumentosByIdProceso: async (idProceso: number) => {
    try {
      console.log(`[Portal] Consultando documentos del proceso ID: ${idProceso}`);
      const response = await portalClient.get(`/Proceso/Documentos/${idProceso}`);
      console.log(`[Portal] Documentos recibidos:`, response.data);
      
      // La API puede devolver { documentos: [...] }
      if (response.data && Array.isArray(response.data.documentos)) {
        return { success: true, data: response.data.documentos };
      }
      
      // Si viene directamente el array
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: [] };
    } catch (error: any) {
      console.error('[Portal] Error fetching documents:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al consultar los documentos',
        data: [] 
      };
    }
  },

  // Cargar todas las páginas de actuaciones (para análisis completo)
  getAllActuaciones: async (idProceso: number) => {
    try {
      const todasActuaciones: any[] = [];
      let pagina = 1;
      let tieneMasPaginas = true;

      while (tieneMasPaginas) {
        const result = await judicialPortalAPI.getActuacionesByIdProceso(idProceso, pagina);
        
        if (!result.success || !result.data) {
          break;
        }

        const { actuaciones, paginacion } = result.data;
        
        if (actuaciones && actuaciones.length > 0) {
          todasActuaciones.push(...actuaciones);
        }

        if (paginacion && pagina < paginacion.cantidadPaginas) {
          pagina++;
        } else {
          tieneMasPaginas = false;
        }
      }

      return { success: true, data: todasActuaciones };
    } catch (error: any) {
      console.error('Error fetching all activities from portal:', error);
      return { 
        success: false, 
        message: 'Error al cargar todas las actuaciones',
        data: [] 
      };
    }
  },
};

export default apiService;