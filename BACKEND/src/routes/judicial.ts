import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { supabaseService } from '../config/supabase';
import { ModernScrapingService } from '../services/scrapingService.modern';

const router = Router();

// PUBLIC ROUTES - No authentication required

// POST /api/judicial/consult - Consult a process (public endpoint)
router.post('/consult', async (req: Request, res: Response) => {
  try {
    const { numeroRadicacion } = req.body;
    
    if (!numeroRadicacion) {
      return res.status(400).json({
        error: 'Número de radicación requerido'
      });
    }
    
    logger.info(`Public consultation for process: ${numeroRadicacion}`);
    
    // Check if forcing a fresh consultation
    const forceRefresh = req.query.refresh === 'true' || req.query.fresh === 'true';
    
    // First check if process exists in database (unless forcing refresh)
    let processId = forceRefresh ? null : await ModernScrapingService.processExists(numeroRadicacion);
    let processData;
    
    if (processId && !forceRefresh) {
      // Get from database
      logger.info('Process found in database, retrieving...');
      processData = await getProcessFromDatabase(processId);
    } else {
      // Scrape from portal
      logger.info('Process not in database, scraping from portal...');
      const scrapedData = await ModernScrapingService.scrapeProcessData(numeroRadicacion);
      
      if (!scrapedData) {
        return res.status(404).json({
          error: 'Proceso no encontrado',
          message: 'No se encontró información del proceso en el portal oficial'
        });
      }
      
      // Save to database (this will update if exists due to upsert)
      processId = await ModernScrapingService.saveProcessData(scrapedData);
      processData = scrapedData;
    }
    
    // Log the consultation
    await logConsultation(null, processId, 'public_consult', req.ip, req.get('User-Agent'), 'success');
    
    return res.json({
      success: true,
      data: processData,
      source: processId ? 'database' : 'portal'
    });
    
  } catch (error) {
    logger.error('Process consultation error:', error);
    
    await logConsultation(null, null, 'public_consult', req.ip, req.get('User-Agent'), 'error', (error as Error).message);
    
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Error al consultar el proceso'
    });
  }
});

// GET /api/judicial/search - Search processes by various criteria
router.get('/search', async (req, res) => {
  try {
    const { 
      q,           // General search query
      despacho,    // Court name
      demandante,  // Plaintiff
      demandado,   // Defendant
      tipo,        // Process type
      page = 1,
      limit = 10
    } = req.query;
    
    logger.info('Public search request:', req.query);
    
    // Build search filters
    const filters: any = {};
    
    if (despacho) filters.despacho = despacho;
    if (demandante) filters.demandante = demandante;
    if (demandado) filters.demandado = demandado;
    if (tipo) filters.tipo_proceso = tipo;
    
    const searchOptions = {
      filters,
      limit: Math.min(parseInt(limit as string), 50), // Max 50 results
      offset: (parseInt(page as string) - 1) * parseInt(limit as string)
    };
    
    // If general search query, use text search
    let results;
    if (q) {
      // Use the search_vector for text search
      results = await supabaseService.getClient()
        .from('judicial_processes')
        .select('numero_radicacion, fecha_radicacion, despacho, demandante, demandado, tipo_proceso')
        .textSearch('search_vector', q as string, { type: 'websearch' })
        .range(searchOptions.offset, searchOptions.offset + searchOptions.limit - 1);
        
      results = results.data;
    } else {
      results = await supabaseService.select('judicial_processes', searchOptions);
    }
    
    res.json({
      success: true,
      data: results || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: results?.length || 0
      }
    });
    
  } catch (error) {
    logger.error('Process search error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Error al buscar procesos'
    });
  }
});

// GET /api/judicial/:numeroRadicacion/activities - Get process activities
router.get('/:numeroRadicacion/activities', async (req: Request, res: Response) => {
  try {
    const { numeroRadicacion } = req.params;
    
    // Find process
    const processId = await ModernScrapingService.processExists(numeroRadicacion);
    if (!processId) {
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }
    
    // Get activities
    const activities = await supabaseService.select('process_activities', {
      filters: { process_id: processId },
      order: { column: 'fecha_actuacion', ascending: false }
    });
    
    return res.json({
      success: true,
      data: activities || []
    });
    
  } catch (error) {
    logger.error('Get activities error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/judicial/:numeroRadicacion/subjects - Get process subjects
router.get('/:numeroRadicacion/subjects', async (req: Request, res: Response) => {
  try {
    const { numeroRadicacion } = req.params;
    
    // Find process
    const processId = await ModernScrapingService.processExists(numeroRadicacion);
    if (!processId) {
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }
    
    // Get subjects
    const subjects = await supabaseService.select('process_subjects', {
      filters: { process_id: processId }
    });
    
    return res.json({
      success: true,
      data: subjects || []
    });
    
  } catch (error) {
    logger.error('Get subjects error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// AUTHENTICATED ROUTES - Require authentication

// GET /api/judicial/monitored - Get user's monitored processes
router.get('/monitored', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Get user's monitored processes
    const userProcesses = await supabaseService.select('user_processes', {
      filters: { user_id: userId }
    });
    
    if (!userProcesses || userProcesses.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No tienes procesos monitoreados'
      });
    }
    
    // Get process details for each monitored process
    const processIds = userProcesses.map(up => up.process_id);
    const processes = [];
    
    for (const processId of processIds) {
      const processData = await getProcessFromDatabase(processId);
      if (processData) {
        const userProcess = userProcesses.find(up => up.process_id === processId);
        processes.push({
          ...processData,
          monitoring_info: {
            role: userProcess.role,
            alias: userProcess.alias,
            added_at: userProcess.created_at
          }
        });
      }
    }
    
    return res.json({
      success: true,
      data: processes
    });
    
  } catch (error) {
    logger.error('Get user processes error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/judicial/monitor - Add a process to user's monitoring list
router.post('/monitor', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { numeroRadicacion, role = 'observer', alias } = req.body;
    
    // Check if process exists or scrape it
    let processId = await ModernScrapingService.processExists(numeroRadicacion);
    
    if (!processId) {
      // Scrape the process first
      const processData = await ModernScrapingService.scrapeProcessData(numeroRadicacion);
      
      if (!processData) {
        return res.status(404).json({
          error: 'Proceso no encontrado',
          message: 'No se pudo obtener información del proceso'
        });
      }
      
      processId = await ModernScrapingService.saveProcessData(processData);
    }
    
    // Check if user is already monitoring this process
    const existingMonitoring = await supabaseService.select('user_processes', {
      filters: { user_id: userId, process_id: processId }
    });
    
    if (existingMonitoring && existingMonitoring.length > 0) {
      return res.status(400).json({
        error: 'Proceso ya monitoreado',
        message: 'Ya estás monitoreando este proceso'
      });
    }
    
    // Add to monitoring
    await supabaseService.insert('user_processes', {
      user_id: userId,
      process_id: processId,
      role,
      alias
    });
    
    return res.json({
      success: true,
      message: 'Proceso agregado al monitoreo exitosamente'
    });
    
  } catch (error) {
    logger.error('Monitor process error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/judicial/monitor/:numeroRadicacion - Remove from monitoring
router.delete('/monitor/:numeroRadicacion', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { numeroRadicacion } = req.params;
    
    // Find process
    const processId = await ModernScrapingService.processExists(numeroRadicacion);
    if (!processId) {
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }
    
    // Remove from monitoring
    const client = supabaseService.getClient();
    const { error } = await client
      .from('user_processes')
      .delete()
      .eq('user_id', userId)
      .eq('process_id', processId);
    
    if (error) {
      throw error;
    }
    
    return res.json({
      success: true,
      message: 'Proceso removido del monitoreo'
    });
    
  } catch (error) {
    logger.error('Unmonitor process error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Helper functions

async function getProcessFromDatabase(processId: string) {
  try {
    // Get main process info
    const processes = await supabaseService.select('judicial_processes', {
      filters: { id: processId }
    });
    
    if (!processes || processes.length === 0) {
      return null;
    }
    
    const process = processes[0];
    
    // Get related data
    const [activities, subjects, documents] = await Promise.all([
      supabaseService.select('process_activities', { 
        filters: { process_id: processId },
        order: { column: 'fecha_actuacion', ascending: false }
      }),
      supabaseService.select('process_subjects', { 
        filters: { process_id: processId }
      }),
      supabaseService.select('process_documents', { 
        filters: { process_id: processId }
      })
    ]);
    
    return {
      ...process,
      actuaciones: activities || [],
      sujetos: subjects || [],
      documentos: documents || []
    };
  } catch (error) {
    logger.error('Error getting process from database:', error);
    return null;
  }
}

async function logConsultation(
  userId: string | null, 
  processId: string | null, 
  type: string, 
  ip: string | undefined, 
  userAgent: string | undefined, 
  status: string, 
  errorMessage?: string
) {
  try {
    await supabaseService.insert('consultation_history', {
      user_id: userId,
      process_id: processId,
      consultation_type: type,
      ip_address: ip,
      user_agent: userAgent,
      result_status: status,
      error_message: errorMessage
    });
  } catch (error) {
    logger.error('Error logging consultation:', error);
  }
}

export default router;