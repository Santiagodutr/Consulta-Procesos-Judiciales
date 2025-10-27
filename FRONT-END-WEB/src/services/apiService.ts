/// <reference types="node" />
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';
import { judicialPortalService, JudicialProcessData } from './judicialPortalService.ts';

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
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];

  constructor() {
    // Configurar la URL base del backend desde variables de entorno
    const apiBaseURL = this.resolveBaseUrl();
    
    this.client = axios.create({
      baseURL: apiBaseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private resolveBaseUrl(): string {
    const envUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL;

    const sanitize = (value: string) => value.replace(/\/$/, '');

    if (envUrl && envUrl.trim().length > 0) {
      return sanitize(envUrl.trim());
    }

    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (isLocalhost) {
      return 'http://localhost:8080/api';
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return origin ? `${sanitize(origin)}/api` : '/api';
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (config.headers) {
          delete config.headers.Authorization;
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
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
        const status = error.response?.status;
        const requestUrl = originalRequest?.url || '';

        if (status === 401 && originalRequest && requestUrl !== '/auth/login' && !requestUrl?.includes('/auth/refresh-token')) {
          if (originalRequest._retry) {
            this.handleUnauthorized();
            return Promise.reject(error);
          }

          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            this.handleUnauthorized();
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.subscribeTokenRefresh((token) => {
                if (!token) {
                  reject(error);
                  return;
                }
                if (!originalRequest.headers) {
                  originalRequest.headers = {};
                }
                originalRequest.headers.Authorization = `Bearer ${token}`;
                originalRequest._retry = true;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              const newToken = localStorage.getItem('access_token');
              this.onTokenRefreshed(newToken);
              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return this.client(originalRequest);
            }

            this.handleUnauthorized();
          } catch (refreshError) {
            this.handleUnauthorized();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }

          return Promise.reject(error);
        }

        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private subscribeTokenRefresh(callback: (token: string | null) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string | null) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private handleUnauthorized() {
    if (this.refreshSubscribers.length > 0) {
      this.onTokenRefreshed(null);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    delete this.client.defaults.headers.Authorization;
    if (window.location.pathname !== '/login') {
      toast.error('Tu sesión expiró. Por favor inicia sesión nuevamente.');
      window.location.replace('/login');
    }
  }

  private handleError(error: AxiosError<ApiResponse>) {
    // Don't show toast errors for judicial consultation endpoints (public)
    const isJudicialConsultation = error.config?.url?.includes('/judicial/');
    
    if (error.response && !isJudicialConsultation) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
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

  getUnreadNotifications: (limit?: number) =>
    apiService.get('/notifications/unread', limit ? { limit } : undefined),

  markAsRead: (notificationId: string) =>
    apiService.post(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    apiService.post('/notifications/read-all'),
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

// API tradicional que usa el backend local
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
  
  getConsultationHistory: (limit?: number) =>
    apiService.get('/judicial/consultation-history', { limit: limit || 10 }),
  
  getMonitoredProcesses: (params?: any) =>
    apiService.get('/judicial/monitored', params),
  
  monitorProcess: (numeroRadicacion: string) =>
    apiService.post('/judicial/monitor', { numeroRadicacion }),
};

// Nueva API que consulta directamente al portal judicial
export const directJudicialAPI = {
  /**
   * Consulta un proceso directamente al portal judicial y lo guarda en BD
   */
  consultProcess: async (numeroRadicacion: string, soloActivos?: boolean): Promise<ApiResponse<JudicialProcessData>> => {
    try {
      console.log(`Consultando proceso ${numeroRadicacion} al portal judicial...`);
      
      // Paso 1: Consultar directamente al portal judicial
      const processData = await judicialPortalService.consultProcess(numeroRadicacion, soloActivos || false);
      
      if (processData) {
        console.log('Datos obtenidos del portal, guardando en base de datos...');
        
        // Paso 2: Guardar automáticamente en la base de datos local (opcional)
        try {
          await directJudicialAPI.saveProcessToDatabase(processData);
          console.log('✅ Proceso guardado exitosamente en la base de datos local');
        } catch (saveError) {
          console.log('ℹ️ Backend local no disponible, consulta realizada solo desde portal judicial');
          // No fallar la consulta si no se puede guardar en BD - esto es completamente opcional
        }
        
        return {
          success: true,
          data: processData,
          message: 'Proceso consultado exitosamente desde el portal judicial y guardado en BD local'
        };
      } else {
        return {
          success: false,
          message: 'Proceso no encontrado en el portal judicial'
        };
      }
    } catch (error: any) {
      console.error('Error consultando proceso:', error);
      return {
        success: false,
        message: error.message || 'Error al consultar el proceso',
        errors: [error.message || 'Error desconocido']
      };
    }
  },

  /**
   * Guarda la información del proceso en la base de datos local (modo silencioso)
   */
  saveProcessToDatabase: async (processData: JudicialProcessData): Promise<void> => {
    try {
      // Convertir los datos al formato esperado por el backend
      const backendData = {
        processData: {
          numero_radicacion: processData.numeroRadicacion,
          fecha_radicacion: processData.fechaRadicacion,
          fecha_proceso: processData.fechaProceso,
          fecha_ultima_actuacion: processData.fechaUltimaActuacion,
          despacho: processData.despacho,
          departamento: processData.departamento,
          tipo_proceso: processData.tipoProceso,
          demandante: processData.demandante,
          demandado: processData.demandado,
          sujetos_procesales: processData.sujetosProcesales,
          cantidad_folios: processData.cantidadFolios || 0,
          es_privado: processData.esPrivado || false,
          estado: processData.estado || 'Activo',
          portal_url: processData.portalUrl,
          actuaciones: processData.actuaciones || [],
          sujetos: processData.sujetos || [],
          documentos: processData.documentos || []
        }
      };

      // Enviar al backend usando el apiService normal
      await apiService.post('/judicial/save-process', backendData);
      console.log('Proceso guardado exitosamente en la base de datos');
    } catch (error) {
      // Solo loguear el error, no mostrarlo al usuario ya que es opcional
      console.debug('Backend local no disponible para guardar proceso:', error);
      // No re-lanzamos el error para que sea silencioso
    }
  },

  /**
   * Valida el formato del número de radicación
   */
  validateRadicationNumber: (numeroRadicacion: string): boolean => {
    return judicialPortalService.isValidRadicationNumber(numeroRadicacion);
  },

  /**
   * Obtiene la URL del portal para un proceso
   */
  getPortalUrl: (numeroRadicacion: string): string => {
    return judicialPortalService.getPortalUrl(numeroRadicacion);
  },

  /**
   * Guardar proceso como favorito
   */
  saveFavoriteProcess: async (processData: {
    numero_radicacion: string;
    despacho: string;
    demandante: string;
    demandado: string;
    tipo_proceso: string;
    fecha_radicacion: string;
  }): Promise<ApiResponse> => {
    try {
      const response = await apiService.post('/judicial/processes/favorites', processData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al guardar proceso favorito');
    }
  },

  /**
   * Remover proceso de favoritos
   */
  removeFavoriteProcess: async (numeroRadicacion: string): Promise<ApiResponse> => {
    try {
      const response = await apiService.delete(`/judicial/processes/favorites/${numeroRadicacion}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al remover proceso favorito');
    }
  },

  /**
   * Obtener lista de procesos favoritos
   */
  getFavoriteProcesses: async (): Promise<ApiResponse> => {
    try {
      const response = await apiService.get('/judicial/processes/favorites');
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener procesos favoritos');
    }
  },

  /**
   * Verificar si un proceso es favorito
   */
  checkIfFavorite: async (numeroRadicacion: string): Promise<boolean> => {
    try {
      const response = await apiService.get(`/judicial/processes/favorites/check/${numeroRadicacion}`);
      return response.data?.isFavorite || false;
    } catch (error: any) {
      return false;
    }
  }
};

export default apiService;