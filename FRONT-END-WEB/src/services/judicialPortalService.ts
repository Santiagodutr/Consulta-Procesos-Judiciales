import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Interfaces para las respuestas del portal judicial
export interface ProcessBasicInfo {
  idProceso: number;
  idConexion: number;
  llaveProceso: string;
  fechaProceso: string;
  fechaUltimaActuacion?: string;
  despacho: string;
  departamento?: string;
  sujetosProcesales?: string;
  cantFilas: number;
  esPrivado: boolean;
}

export interface ProcessActivity {
  idActuacion: number;
  consActuacion: number;
  fechaActuacion: string;
  actuacion: string;
  anotacion?: string;
  fechaInicioTermino?: string;
  fechaFinalizaTermino?: string;
  codigoRegla?: string;
  conDocumentos: boolean;
  cantFolios: number;
}

export interface ProcessSubject {
  idRegSujeto?: number;
  tipoSujeto?: string;
  esEmplazado?: boolean;
  identificacion?: string | null;
  nombreRazonSocial?: string;
  cant?: number;
  // Mantener compatibilidad con respuestas antiguas
  lnIdSujetoProceso?: number;
  lsNombreSujeto?: string;
  lsTipoSujeto?: string;
  lsIdentificacion?: string;
  lsTipoIdentificacion?: string;
  lsApoderado?: string;
  lbTieneApoderado?: string;
}

export interface ProcessDocument {
  lnIdDocumento: number;
  lsNombreArchivo: string;
  lsTipoDocumento: string;
  lsUrlDescarga?: string;
  lnTamanoArchivo?: number;
  lsExtensionArchivo?: string;
  ldFechaDocumento?: string;
}

export interface JudicialProcessData {
  // Información básica
  idProceso?: number;  // ID interno del portal
  idConexion?: number;
  numeroRadicacion: string;
  fechaRadicacion?: string;
  fechaProceso?: string;
  fechaUltimaActuacion?: string;
  
  // Información del despacho
  despacho: string;
  departamento?: string;
  tipoProceso?: string;
  
  // Partes del proceso
  demandante?: string;
  demandado?: string;
  sujetosProcesales?: string;
  
  // Metadatos
  cantidadFolios?: number;
  esPrivado?: boolean;
  estado?: string;
  portalUrl?: string;
  
  // Información consultada desde
  consultadoDesde: 'portal' | 'local';
  
  // Datos relacionados
  actuaciones?: ProcessActivity[];
  sujetos?: ProcessSubject[];
  documentos?: ProcessDocument[];
}

interface PortalResponse<T> {
  procesos?: T[];
  actuaciones?: T[];
  lsData?: T[];
  isSuccess?: boolean;
}

class JudicialPortalService {
  private client: AxiosInstance;
  
  // URLs del portal judicial
  private readonly BASE_URL = 'https://consultaprocesos.ramajudicial.gov.co';
  private readonly PORTAL_API_URL = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion';
  private readonly DETAILS_API_URL = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Detalle';
  private readonly ACTIVITIES_API_URL = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones';
  private readonly SUBJECTS_API_URL = 'https://consultaprocesos.ramajudicial.gov.co/api/v1/Process/GetSujetosProcesales';
  private readonly DOCUMENTS_API_URL = 'https://consultaprocesos.ramajudicial.gov.co/api/Process/GetDocumentos';
  
  // Nuevos endpoints específicos por ID de proceso (para pestañas)
  private readonly SUJETOS_BY_ID_URL = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Sujetos';
  private readonly DOCUMENTOS_BY_ID_URL = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Documentos';
  private readonly ACTUACIONES_BY_ID_URL = 'https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones';

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://consultaprocesos.ramajudicial.gov.co/',
        'Origin': 'https://consultaprocesos.ramajudicial.gov.co',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Response interceptor para manejar errores
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        console.error('Error en consulta al portal judicial:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Consulta completa de un proceso judicial
   */
  async consultProcess(numeroRadicacion: string, soloActivos: boolean = false): Promise<JudicialProcessData | null> {
    try {
      console.log(`Consultando proceso ${numeroRadicacion} directamente al portal judicial`);

      // Paso 1: Obtener información básica
      const basicInfo = await this.getProcessBasicInfo(numeroRadicacion, soloActivos);
      if (!basicInfo) {
        return null;
      }

      // Paso 2: Obtener actuaciones
      const activities = await this.getProcessActivities(numeroRadicacion);

      // Paso 3: Obtener sujetos procesales
      const subjects = await this.getProcessSubjects(numeroRadicacion);

      // Paso 4: Obtener documentos (basado en actuaciones)
      const documents = await this.getProcessDocuments(numeroRadicacion, activities);

      // Construir el objeto de respuesta
      const processData: JudicialProcessData = {
        // Información básica
        idProceso: basicInfo.idProceso,
        idConexion: basicInfo.idConexion,
        numeroRadicacion: basicInfo.llaveProceso,
        fechaRadicacion: basicInfo.fechaProceso ? basicInfo.fechaProceso.split('T')[0] : undefined,
        fechaProceso: basicInfo.fechaProceso,
        fechaUltimaActuacion: basicInfo.fechaUltimaActuacion,
        
        // Información del despacho
        despacho: basicInfo.despacho || 'DESPACHO NO DISPONIBLE',
        departamento: basicInfo.departamento,
        tipoProceso: basicInfo.departamento || 'TIPO NO DISPONIBLE',
        
        // Extraer partes del proceso
        ...this.extractParties(basicInfo.sujetosProcesales || ''),
        sujetosProcesales: basicInfo.sujetosProcesales,
        
        // Metadatos
        cantidadFolios: basicInfo.cantFilas || 0,
        esPrivado: basicInfo.esPrivado || false,
        estado: 'Activo',
        portalUrl: `${this.BASE_URL}/Procesos/NumeroRadicacion?numeroRadicacion=${numeroRadicacion}`,
        
        // Origen de la consulta
        consultadoDesde: 'portal',
        
        // Datos relacionados
        actuaciones: activities,
        sujetos: subjects,
        documentos: documents,
      };

      return processData;

    } catch (error) {
      console.error('Error consultando proceso:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles completos del proceso usando idProceso
   * Usa la API: https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Detalle/{idProceso}
   */
  async getProcessDetails(idProceso: number): Promise<any | null> {
    try {
      console.log(`Obteniendo detalles del proceso con ID: ${idProceso}`);
      
      const response = await this.client.get(`${this.DETAILS_API_URL}/${idProceso}`);
      
      if (!response.data) {
        console.warn('No se encontraron detalles para el proceso');
        return null;
      }

      return response.data;

    } catch (error) {
      console.error('Error obteniendo detalles del proceso:', error);
      return null;
    }
  }

  /**
   * Obtener sujetos procesales por ID de proceso
   * API: https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Sujetos/{idProceso}?pagina=1
   */
  async getSujetosByIdProceso(idProceso: number, pagina: number = 1): Promise<ProcessSubject[]> {
    try {
      console.log(`Obteniendo sujetos del proceso ID: ${idProceso}, pagina: ${pagina}`);
      
      const response = await this.client.get(`${this.SUJETOS_BY_ID_URL}/${idProceso}`, {
        params: { pagina }
      });
      
      console.log('Respuesta de sujetos:', response.data);
      
      // La API devuelve { sujetos: [...], paginacion: {...} }
      if (response.data && Array.isArray(response.data.sujetos)) {
        return response.data.sujetos;
      }
      
      // Si viene directamente el array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];

    } catch (error) {
      console.error('Error obteniendo sujetos:', error);
      return [];
    }
  }

  /**
   * Obtener documentos por ID de proceso
   * API: https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Documentos/{idProceso}
   */
  async getDocumentosByIdProceso(idProceso: number): Promise<ProcessDocument[]> {
    try {
      console.log(`Obteniendo documentos del proceso ID: ${idProceso}`);
      
      const response = await this.client.get(`${this.DOCUMENTOS_BY_ID_URL}/${idProceso}`);
      
      console.log('Respuesta de documentos:', response.data);
      
      // La API puede devolver { documentos: [...] }
      if (response.data && Array.isArray(response.data.documentos)) {
        return response.data.documentos;
      }
      
      // Si viene directamente el array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];

    } catch (error) {
      console.error('Error obteniendo documentos:', error);
      return [];
    }
  }

  /**
   * Obtener actuaciones por ID de proceso
   * API: https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/{idProceso}?pagina=1
   */
  async getActuacionesByIdProceso(idProceso: number, pagina: number = 1): Promise<ProcessActivity[]> {
    try {
      console.log(`Obteniendo actuaciones del proceso ID: ${idProceso}, pagina: ${pagina}`);
      
      const response = await this.client.get(`${this.ACTUACIONES_BY_ID_URL}/${idProceso}`, {
        params: { pagina }
      });
      
      console.log('Respuesta de actuaciones:', response.data);
      
      // La API puede devolver { actuaciones: [...], paginacion: {...} }
      if (response.data && Array.isArray(response.data.actuaciones)) {
        return response.data.actuaciones;
      }
      
      // Si viene directamente el array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];

    } catch (error) {
      console.error('Error obteniendo actuaciones:', error);
      return [];
    }
  }

  /**
   * Obtener información básica del proceso
   */
  private async getProcessBasicInfo(numeroRadicacion: string, soloActivos: boolean): Promise<ProcessBasicInfo | null> {
    try {
      const params = {
        numero: numeroRadicacion.trim(),
        SoloActivos: soloActivos,
        pagina: 1
      };

      const response = await this.client.get<PortalResponse<ProcessBasicInfo>>(
        this.PORTAL_API_URL,
        { params }
      );

      if (response.data?.procesos && response.data.procesos.length > 0) {
        return response.data.procesos[0];
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo información básica:', error);
      throw error;
    }
  }

  /**
   * Obtener actuaciones del proceso
   */
  private async getProcessActivities(numeroRadicacion: string): Promise<ProcessActivity[]> {
    try {
      const params = {
        numero: numeroRadicacion.trim(),
        pagina: 1
      };

      const response = await this.client.get<PortalResponse<ProcessActivity>>(
        this.ACTIVITIES_API_URL,
        { params }
      );

      return response.data?.actuaciones || [];
    } catch (error) {
      console.error('Error obteniendo actuaciones:', error);
      return [];
    }
  }

  /**
   * Obtener sujetos procesales
   */
  private async getProcessSubjects(numeroRadicacion: string): Promise<ProcessSubject[]> {
    try {
      const requestBody = {
        lsNroRadicacion: numeroRadicacion.trim()
      };

      const response = await this.client.post<PortalResponse<ProcessSubject>>(
        this.SUBJECTS_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.isSuccess && response.data?.lsData) {
        return response.data.lsData;
      }

      return [];
    } catch (error) {
      console.error('Error obteniendo sujetos procesales:', error);
      return [];
    }
  }

  /**
   * Obtener documentos del proceso
   */
  private async getProcessDocuments(numeroRadicacion: string, activities: ProcessActivity[]): Promise<ProcessDocument[]> {
    try {
      const allDocuments: ProcessDocument[] = [];

      // Obtener documentos para cada actuación que los tenga
      for (const activity of activities) {
        if (activity.conDocumentos && activity.idActuacion) {
          try {
            const documents = await this.getDocumentsForActivity(numeroRadicacion, activity.idActuacion);
            allDocuments.push(...documents);
          } catch (error) {
            console.error(`Error obteniendo documentos para actuación ${activity.idActuacion}:`, error);
          }
        }
      }

      return allDocuments;
    } catch (error) {
      console.error('Error obteniendo documentos:', error);
      return [];
    }
  }

  /**
   * Obtener documentos para una actuación específica
   */
  private async getDocumentsForActivity(numeroRadicacion: string, idActuacion: number): Promise<ProcessDocument[]> {
    try {
      const requestBody = {
        lsNroRadicacion: numeroRadicacion.trim(),
        lnIdActuacion: idActuacion
      };

      const response = await this.client.post<PortalResponse<ProcessDocument>>(
        this.DOCUMENTS_API_URL,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.isSuccess && response.data?.lsData) {
        return response.data.lsData;
      }

      return [];
    } catch (error) {
      console.error('Error obteniendo documentos de actuación:', error);
      return [];
    }
  }

  /**
   * Extraer demandante y demandado del string de sujetos procesales
   */
  private extractParties(sujetosProcesales: string): { demandante?: string; demandado?: string } {
    const result: { demandante?: string; demandado?: string } = {};

    try {
      // Patrón para extraer demandante
      const demandantePattern = /Demandante:\s*([^|]+)/i;
      const demandanteMatch = sujetosProcesales.match(demandantePattern);
      if (demandanteMatch) {
        result.demandante = demandanteMatch[1].trim();
      }

      // Patrón para extraer demandado
      const demandadoPattern = /Demandado:\s*([^|]+)/i;
      const demandadoMatch = sujetosProcesales.match(demandadoPattern);
      if (demandadoMatch) {
        result.demandado = demandadoMatch[1].trim();
      }
    } catch (error) {
      console.error('Error extrayendo partes:', error);
    }

    // Valores por defecto si no se encuentran
    return {
      demandante: result.demandante || 'NO DISPONIBLE',
      demandado: result.demandado || 'NO DISPONIBLE'
    };
  }

  /**
   * Validar si un número de radicación tiene el formato correcto
   */
  isValidRadicationNumber(numeroRadicacion: string): boolean {
    // Formato típico: AAAAAAAAAAAAAAAAAAAAAA (22 dígitos)
    const pattern = /^\d{20,25}$/;
    return pattern.test(numeroRadicacion.trim());
  }

  /**
   * Obtener URL del portal para un proceso
   */
  getPortalUrl(numeroRadicacion: string): string {
    return `${this.BASE_URL}/Procesos/NumeroRadicacion?numeroRadicacion=${numeroRadicacion}`;
  }

  /**
   * Descargar proceso en formato DOCX
   */
  async downloadDOCX(numeroRadicacion: string, soloActivos: boolean = false): Promise<void> {
    try {
      const url = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Descarga/DOCX/Procesos/NumeroRadicacion?numero=${numeroRadicacion}&SoloActivos=${soloActivos}&pagina=1`;
      
      // Usar fetch para descargar el archivo
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar el archivo DOCX');
      }

      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear un enlace temporal para descargar el archivo
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Proceso_${numeroRadicacion}.docx`;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error descargando archivo DOCX:', error);
      throw new Error('No se pudo descargar el archivo DOCX. Por favor, intente nuevamente.');
    }
  }

  /**
   * Descargar proceso en formato CSV
   */
  async downloadCSV(numeroRadicacion: string, soloActivos: boolean = false): Promise<void> {
    try {
      const url = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Descarga/CSV/Procesos/NumeroRadicacion?numero=${numeroRadicacion}&SoloActivos=${soloActivos}&pagina=1`;
      
      // Usar fetch para descargar el archivo
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv'
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar el archivo CSV');
      }

      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear un enlace temporal para descargar el archivo
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Proceso_${numeroRadicacion}.csv`;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error descargando archivo CSV:', error);
      throw new Error('No se pudo descargar el archivo CSV. Por favor, intente nuevamente.');
    }
  }
}

// Crear y exportar instancia singleton
export const judicialPortalService = new JudicialPortalService();

// Exportar tipos e interfaces
export type { PortalResponse };

export default judicialPortalService;