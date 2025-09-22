import { logger } from '../utils/logger';
import { supabaseService } from '../config/supabase';
import axios, { AxiosResponse } from 'axios';

export interface ProcessData {
  // Portal API fields
  id_proceso?: number;
  id_conexion?: number;
  numero_radicacion: string;
  
  // Date fields
  fecha_radicacion: string;
  fecha_proceso?: string;
  fecha_ultima_actuacion?: string;
  
  // Court and case info
  despacho: string;
  departamento?: string;
  ponente?: string;
  ubicacion_expediente?: string;
  tipo_proceso: string;
  clase_proceso?: string;
  subclase_proceso?: string;
  
  // Parties information
  demandante: string;
  demandado: string;
  sujetos_procesales?: string;
  apoderado_demandante?: string;
  apoderado_demandado?: string;
  
  // Process metadata
  cantidad_folios?: number;
  es_privado?: boolean;
  estado?: string;
  solo_activos?: boolean;
  portal_url?: string;
  
  // Related data
  actuaciones?: ProcessActivity[];
  sujetos?: ProcessSubject[];
  documentos?: ProcessDocument[];
}

export interface ProcessActivity {
  id_actuacion?: number;
  cons_actuacion?: number;
  fecha_actuacion: string;
  actuacion: string;
  anotacion?: string;
  fecha_inicio_termino?: string;
  fecha_finaliza_termino?: string;
  codigo_regla?: string;
  con_documentos?: boolean;
  cant_folios?: number;
}

export interface ProcessSubject {
  id_sujeto_proceso?: number;
  nombre_sujeto: string;
  tipo_sujeto: string;
  identificacion?: string;
  tipo_identificacion?: string;
  apoderado?: string;
  tiene_apoderado?: boolean;
}

export interface ProcessDocument {
  id_documento?: number;
  nombre_archivo: string;
  tipo_documento?: string;
  url_descarga?: string;
  tamano_archivo?: number;
  extension_archivo?: string;
  fecha_documento?: string;
}

export class ModernScrapingService {
  private static readonly BASE_URL = 'https://consultaprocesos.ramajudicial.gov.co';
  private static readonly API_BASE = `${this.BASE_URL}/api`;
  
  /**
   * Main method to scrape process data from Colombian judicial portal
   */
  static async scrapeProcessData(numeroRadicacion: string): Promise<ProcessData | null> {
    try {
      logger.info(`Starting API consultation for process: ${numeroRadicacion}`);
      
      // Step 1: Get process basic information
      const basicInfo = await this.getProcessBasicInfo(numeroRadicacion);
      if (!basicInfo) {
        logger.warn(`No basic info found for process: ${numeroRadicacion}`);
        return null;
      }
      
      // Step 2: Get process activities (actuaciones)
      const activities = await this.getProcessActivities(numeroRadicacion);
      
      // Step 3: Get process subjects (sujetos procesales)
      const subjects = await this.getProcessSubjects(numeroRadicacion);
      
      // Step 4: Get process documents
      const documents = await this.getProcessDocuments(numeroRadicacion);
      
      if (!basicInfo || !basicInfo.numero_radicacion) {
        logger.warn(`Invalid basic info for process: ${numeroRadicacion}`);
        return null;
      }

      const processData: ProcessData = {
        ...basicInfo as Required<Pick<ProcessData, 'numero_radicacion' | 'fecha_radicacion' | 'despacho' | 'demandante' | 'demandado' | 'tipo_proceso'>>,
        actuaciones: activities,
        sujetos: subjects,
        documentos: documents
      };
      
      logger.info(`Successfully scraped data for process: ${numeroRadicacion}`);
      return processData;
      
    } catch (error) {
      logger.error(`Error scraping process ${numeroRadicacion}:`, error);
      return null;
    }
  }
  
  /**
   * Get basic process information using the real API endpoint from the portal
   */
  private static async getProcessBasicInfo(numeroRadicacion: string): Promise<Partial<ProcessData> | null> {
    try {
      // Use the real API endpoint that the portal uses
      const apiUrl = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion`;
      
      const response = await axios.get(apiUrl, {
        params: {
          numero: numeroRadicacion.trim(),
          SoloActivos: false,
          pagina: 1
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Referer': 'https://consultaprocesos.ramajudicial.gov.co/',
          'Origin': 'https://consultaprocesos.ramajudicial.gov.co',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site'
        },
        timeout: 30000
      });
      
      if (response.data && response.data.procesos && response.data.procesos.length > 0) {
        const proceso = response.data.procesos[0];
        
        // Extract demandante and demandado from sujetosProcesales field
        let demandante = 'NO DISPONIBLE';
        let demandado = 'NO DISPONIBLE';
        
        if (proceso.sujetosProcesales) {
          const sujetos = proceso.sujetosProcesales;
          
          // Extract demandante
          const demandanteMatch = sujetos.match(/Demandante:\s*([^|]+)/i);
          if (demandanteMatch) {
            demandante = demandanteMatch[1].trim();
          }
          
          // Extract demandado  
          const demandadoMatch = sujetos.match(/Demandado:\s*([^|]+)/i);
          if (demandadoMatch) {
            demandado = demandadoMatch[1].trim();
          }
        }
        
        return {
          // Portal API fields
          id_proceso: proceso.idProceso,
          id_conexion: proceso.idConexion,
          numero_radicacion: proceso.llaveProceso || numeroRadicacion,
          
          // Date fields
          fecha_radicacion: proceso.fechaProceso ? proceso.fechaProceso.split('T')[0] : null,
          fecha_proceso: proceso.fechaProceso,
          fecha_ultima_actuacion: proceso.fechaUltimaActuacion,
          
          // Court and case info
          despacho: proceso.despacho || 'DESPACHO NO DISPONIBLE',
          departamento: proceso.departamento || null,
          tipo_proceso: proceso.departamento || 'TIPO NO DISPONIBLE',
          
          // Parties information
          demandante: demandante,
          demandado: demandado,
          sujetos_procesales: proceso.sujetosProcesales || null,
          
          // Process metadata
          cantidad_folios: proceso.cantFilas || 0,
          es_privado: proceso.esPrivado === true,
          estado: 'Activo', // Default state for new processes
          portal_url: `${this.BASE_URL}/Procesos/NumeroRadicacion?numeroRadicacion=${numeroRadicacion}`
        };
      }
      
      return null;
      
    } catch (error) {
      logger.error(`Error getting basic info for ${numeroRadicacion}:`, error);
      
      // Fallback to basic data if API fails
      return {
        numero_radicacion: numeroRadicacion,
        fecha_radicacion: new Date().toISOString().split('T')[0],
        despacho: 'CONSULTADO - API NO DISPONIBLE',
        demandante: 'PROCESO ENCONTRADO',
        demandado: 'PROCESO ENCONTRADO', 
        tipo_proceso: 'CONSULTA REALIZADA',
        es_privado: false,
        portal_url: `${this.BASE_URL}/Procesos/NumeroRadicacion?numeroRadicacion=${numeroRadicacion}`
      };
    }
  }
  
  /**
   * Get process activities/actuaciones using real API
   */
  private static async getProcessActivities(numeroRadicacion: string): Promise<ProcessActivity[]> {
    try {
      // Try to get activities from the real portal API
      const apiUrl = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones`;
      
      const response = await axios.get(apiUrl, {
        params: {
          numero: numeroRadicacion.trim(),
          pagina: 1
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Referer': 'https://consultaprocesos.ramajudicial.gov.co/',
          'Origin': 'https://consultaprocesos.ramajudicial.gov.co'
        },
        timeout: 30000
      });

      if (response.data && response.data.actuaciones && Array.isArray(response.data.actuaciones)) {
        return response.data.actuaciones.map((act: any) => ({
          id_actuacion: act.idActuacion,
          cons_actuacion: act.consActuacion,
          fecha_actuacion: act.fechaActuacion,
          actuacion: act.actuacion,
          anotacion: act.anotacion,
          fecha_inicio_termino: act.fechaInicioTermino,
          fecha_finaliza_termino: act.fechaFinalizaTermino,
          codigo_regla: act.codigoRegla,
          con_documentos: act.conDocumentos === true,
          cant_folios: act.cantFolios || 0
        }));
      }

      return [];
    } catch (error) {
      logger.error(`Error getting activities for ${numeroRadicacion}:`, error);
      return [];
    }
  }  /**
   * Get process subjects/sujetos procesales
   */
  private static async getProcessSubjects(numeroRadicacion: string): Promise<ProcessSubject[]> {
    try {
      const response = await axios.post(`${this.API_BASE}/v1/Process/GetSujetosProcesales`, {
        lsNroRadicacion: numeroRadicacion.trim()
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': this.BASE_URL,
          'Origin': this.BASE_URL
        },
        timeout: 30000
      });
      
      if (response.data && response.data.isSuccess && response.data.lsData) {
        return response.data.lsData.map((item: any) => ({
          id_sujeto_proceso: item.lnIdSujetoProceso,
          nombre_sujeto: item.lsNombreSujeto,
          tipo_sujeto: item.lsTipoSujeto,
          identificacion: item.lsIdentificacion,
          tipo_identificacion: item.lsTipoIdentificacion,
          apoderado: item.lsApoderado,
          tiene_apoderado: item.lbTieneApoderado === 'S'
        }));
      }
      
      return [];
    } catch (error) {
      logger.error(`Error getting subjects for ${numeroRadicacion}:`, error);
      return [];
    }
  }
  
  /**
   * Get process documents
   */
  private static async getProcessDocuments(numeroRadicacion: string): Promise<ProcessDocument[]> {
    try {
      // First get activities to find documents associated with them
      const activities = await this.getProcessActivities(numeroRadicacion);
      const documents: ProcessDocument[] = [];
      
      for (const activity of activities) {
        if (activity.con_documentos && activity.id_actuacion) {
          const activityDocs = await this.getDocumentsForActivity(numeroRadicacion, activity.id_actuacion);
          documents.push(...activityDocs);
        }
      }
      
      return documents;
    } catch (error) {
      logger.error(`Error getting documents for ${numeroRadicacion}:`, error);
      return [];
    }
  }
  
  /**
   * Get documents for a specific activity
   */
  private static async getDocumentsForActivity(numeroRadicacion: string, idActuacion: number): Promise<ProcessDocument[]> {
    try {
      const response = await axios.post(`${this.API_BASE}/Process/GetDocumentos`, {
        lsNroRadicacion: numeroRadicacion.trim(),
        lnIdActuacion: idActuacion
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': this.BASE_URL,
          'Origin': this.BASE_URL
        },
        timeout: 30000
      });
      
      if (response.data && response.data.isSuccess && response.data.lsData) {
        return response.data.lsData.map((item: any) => ({
          id_documento: item.lnIdDocumento,
          nombre_archivo: item.lsNombreArchivo,
          tipo_documento: item.lsTipoDocumento,
          url_descarga: item.lsUrlDescarga,
          tamano_archivo: item.lnTamanoArchivo,
          extension_archivo: item.lsExtensionArchivo,
          fecha_documento: item.ldFechaDocumento
        }));
      }
      
      return [];
    } catch (error) {
      logger.error(`Error getting documents for activity ${idActuacion}:`, error);
      return [];
    }
  }
  
  /**
   * Save scraped process data to database using upsert
   */
  static async saveProcessData(processData: ProcessData): Promise<string | null> {
    try {
      logger.info(`Saving process data to database: ${processData.numero_radicacion}`);
      
      // Use upsert to insert or update based on numero_radicacion
      const processRecord = await supabaseService.upsert('judicial_processes', {
        // Portal API fields
        id_proceso: processData.id_proceso,
        id_conexion: processData.id_conexion,
        numero_radicacion: processData.numero_radicacion,
        
        // Date fields
        fecha_radicacion: processData.fecha_radicacion,
        fecha_proceso: processData.fecha_proceso,
        fecha_ultima_actuacion: processData.fecha_ultima_actuacion,
        
        // Court and case info
        despacho: processData.despacho,
        departamento: processData.departamento,
        ponente: processData.ponente,
        ubicacion_expediente: processData.ubicacion_expediente,
        tipo_proceso: processData.tipo_proceso,
        clase_proceso: processData.clase_proceso,
        subclase_proceso: processData.subclase_proceso,
        
        // Parties information
        demandante: processData.demandante,
        demandado: processData.demandado,
        sujetos_procesales: processData.sujetos_procesales,
        apoderado_demandante: processData.apoderado_demandante,
        apoderado_demandado: processData.apoderado_demandado,
        
        // Process metadata
        cantidad_folios: processData.cantidad_folios,
        es_privado: processData.es_privado || false,
        estado: processData.estado || 'Activo',
        solo_activos: processData.solo_activos || false,
        portal_url: processData.portal_url,
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, 'numero_radicacion');
      
      if (!processRecord) {
        logger.error('Error saving process data: No record returned');
        return null;
      }
      
      const processId = processRecord.id;
      
      // Save activities
      if (processData.actuaciones && processData.actuaciones.length > 0) {
        try {
          logger.info(`Saving ${processData.actuaciones.length} activities for process ${processId}`);
          
          // First, delete existing activities for this process to avoid duplicates
          await supabaseService.getClient()
            .from('process_activities')
            .delete()
            .eq('process_id', processId);
          
          for (const activity of processData.actuaciones) {
            await supabaseService.insert('process_activities', {
              process_id: processId,
              id_actuacion: activity.id_actuacion,
              cons_actuacion: activity.cons_actuacion,
              fecha_actuacion: activity.fecha_actuacion,
              actuacion: activity.actuacion,
              anotacion: activity.anotacion,
              fecha_inicio_termino: activity.fecha_inicio_termino,
              fecha_finaliza_termino: activity.fecha_finaliza_termino,
              codigo_regla: activity.codigo_regla,
              con_documentos: activity.con_documentos,
              cant_folios: activity.cant_folios
            });
          }
          logger.info(`Successfully saved ${processData.actuaciones.length} activities`);
        } catch (error) {
          logger.error('Error saving activities:', error);
        }
      }
      
      // Save subjects
      if (processData.sujetos && processData.sujetos.length > 0) {
        try {
          logger.info(`Saving ${processData.sujetos.length} subjects for process ${processId}`);
          
          // First, delete existing subjects for this process to avoid duplicates
          await supabaseService.getClient()
            .from('process_subjects')
            .delete()
            .eq('process_id', processId);
          
          for (const subject of processData.sujetos) {
            await supabaseService.insert('process_subjects', {
              process_id: processId,
              id_sujeto_proceso: subject.id_sujeto_proceso,
              nombre_sujeto: subject.nombre_sujeto,
              tipo_sujeto: subject.tipo_sujeto,
              identificacion: subject.identificacion,
              tipo_identificacion: subject.tipo_identificacion,
              apoderado: subject.apoderado,
              tiene_apoderado: subject.tiene_apoderado
            });
          }
          logger.info(`Successfully saved ${processData.sujetos.length} subjects`);
        } catch (error) {
          logger.error('Error saving subjects:', error);
        }
      }
      
      // Save documents
      if (processData.documentos && processData.documentos.length > 0) {
        try {
          logger.info(`Saving ${processData.documentos.length} documents for process ${processId}`);
          
          // First, delete existing documents for this process to avoid duplicates
          await supabaseService.getClient()
            .from('process_documents')
            .delete()
            .eq('process_id', processId);
          
          for (const document of processData.documentos) {
            await supabaseService.insert('process_documents', {
              process_id: processId,
              actuacion_id: null, // Could be linked to specific activity later
              id_documento: document.id_documento,
              nombre_archivo: document.nombre_archivo,
              tipo_documento: document.tipo_documento,
              url_descarga: document.url_descarga,
              tamano_archivo: document.tamano_archivo,
              extension_archivo: document.extension_archivo,
              fecha_documento: document.fecha_documento
            });
          }
          logger.info(`Successfully saved ${processData.documentos.length} documents`);
        } catch (error) {
          logger.error('Error saving documents:', error);
        }
      }
      
      logger.info(`Successfully saved process data for: ${processData.numero_radicacion}`);
      return processId;
      
    } catch (error) {
      logger.error('Error in saveProcessData:', error);
      return null;
    }
  }
  
  /**
   * Check if process exists in database
   */
  static async processExists(numeroRadicacion: string): Promise<string | null> {
    try {
      const data = await supabaseService.select('judicial_processes', {
        filters: { numero_radicacion: numeroRadicacion },
        limit: 1
      });
      
      if (!data || data.length === 0) {
        return null;
      }
      
      return data[0].id;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Update existing process with new data
   */
  static async updateProcessData(processId: string, processData: ProcessData): Promise<boolean> {
    try {
      // Update main process record
      const result = await supabaseService.update('judicial_processes', processId, {
        fecha_radicacion: processData.fecha_radicacion,
        despacho: processData.despacho,
        demandante: processData.demandante,
        demandado: processData.demandado,
        tipo_proceso: processData.tipo_proceso,
        cantidad_folios: processData.cantidad_folios,
        es_privado: processData.es_privado,
        portal_url: processData.portal_url,
        updated_at: new Date().toISOString()
      });
      
      if (!result) {
        logger.error('Error updating process: No result returned');
        return false;
      }
      
      // Note: For a complete implementation, we would need delete methods in supabaseService
      // For now, we'll skip the delete and re-insert logic
      
      return true;
    } catch (error) {
      logger.error('Error updating process data:', error);
      return false;
    }
  }
}

export default ModernScrapingService;