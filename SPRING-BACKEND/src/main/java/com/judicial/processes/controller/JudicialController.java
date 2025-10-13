package com.judicial.processes.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.judicial.processes.dto.ProcessActivity;
import com.judicial.processes.dto.ProcessConsultRequest;
import com.judicial.processes.dto.ProcessData;
import com.judicial.processes.dto.ProcessMonitorRequest;
import com.judicial.processes.dto.ProcessSubject;
import com.judicial.processes.service.JudicialScrapingService;
import com.judicial.processes.service.JudicialService;
import com.judicial.processes.service.SupabaseService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/judicial")
@CrossOrigin(origins = {"http://localhost:3000", "https://localhost:3000"})
public class JudicialController {
    
    private static final Logger logger = LoggerFactory.getLogger(JudicialController.class);
    
    @Autowired
    private JudicialScrapingService scrapingService;
    
    @Autowired
    private SupabaseService supabaseService;
    
    @Autowired
    private JudicialService judicialService;
    
    // PUBLIC ROUTES - No authentication required
    
    /**
     * POST /api/judicial/consult - Consult a process (public endpoint)
     */
    @PostMapping("/consult")
    public ResponseEntity<?> consultProcess(@Valid @RequestBody ProcessConsultRequest request,
                                          @RequestParam(value = "refresh", defaultValue = "false") boolean forceRefresh,
                                          @RequestParam(value = "fresh", defaultValue = "false") boolean fresh,
                                          Authentication authentication,
                                          HttpServletRequest httpRequest) {
        try {
            String numeroRadicacion = request.getNumeroRadicacion();
            
            // Debug authentication
            logger.debug("Authentication object: {}", authentication);
            logger.debug("Authentication isAuthenticated: {}", 
                authentication != null ? authentication.isAuthenticated() : "null");
            logger.debug("Authentication principal: {}", 
                authentication != null ? authentication.getPrincipal() : "null");
            
            String userId = (authentication != null && authentication.isAuthenticated()) 
                ? (String) authentication.getPrincipal() : null;
            
            logger.info("Consultation for process: {} by user: {} (auth present: {}, authenticated: {})", 
                numeroRadicacion, 
                userId != null ? userId : "anonymous",
                authentication != null,
                authentication != null && authentication.isAuthenticated());
            
            // Check if forcing a fresh consultation
            boolean shouldForceRefresh = forceRefresh || fresh;
            
            // First check if process exists in database (unless forcing refresh)
            String processId = shouldForceRefresh ? null : scrapingService.processExists(numeroRadicacion);
            ProcessData processData;
            String source;
            
            if (processId != null && !shouldForceRefresh) {
                // Get from database
                logger.info("Process found in database, retrieving...");
                processData = judicialService.getProcessFromDatabase(processId);
                source = "database";
            } else {
                // Scrape from portal
                logger.info("Process not in database, scraping from portal...");
                Boolean soloActivos = request.getSoloActivos() != null ? request.getSoloActivos() : false;
                processData = scrapingService.scrapeProcessData(numeroRadicacion, soloActivos);
                
                if (processData == null) {
                    judicialService.logConsultation(userId, null, "user_consult", 
                        httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), "not_found", "Proceso no encontrado");
                    
                    return ResponseEntity.status(404).body(Map.of(
                        "error", "Proceso no encontrado",
                        "message", "No se encontró información del proceso en el portal oficial"
                    ));
                }
                
                // Save to database (this will update if exists due to upsert)
                processId = scrapingService.saveProcessData(processData);
                source = "portal";
            }
            
            // Log the consultation with user_id if authenticated
            judicialService.logConsultation(userId, processId, "user_consult", 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), "success", null);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", processData,
                "source", source
            ));
            
        } catch (Exception error) {
            logger.error("Process consultation error:", error);
            
            String userId = (authentication != null && authentication.isAuthenticated()) 
                ? (String) authentication.getPrincipal() : null;
            
            judicialService.logConsultation(userId, null, "user_consult", 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), "error", error.getMessage());
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "message", "Error al consultar el proceso"
            ));
        }
    }
    
    /**
     * POST /api/judicial/save-process - Save process data to database (public endpoint)
     */
    @PostMapping("/save-process")
    public ResponseEntity<?> saveProcess(@RequestBody Map<String, Object> request,
                                       Authentication authentication,
                                       HttpServletRequest httpRequest) {
        try {
            // Extract user ID if authenticated
            String userId = (authentication != null && authentication.isAuthenticated()) 
                ? (String) authentication.getPrincipal() : null;
            
            logger.info("Saving process data to database from frontend by user: {}", 
                userId != null ? userId : "anonymous");
            
            @SuppressWarnings("unchecked")
            Map<String, Object> processData = (Map<String, Object>) request.get("processData");
            
            if (processData == null) {
                return ResponseEntity.status(400).body(Map.of(
                    "error", "Datos del proceso requeridos",
                    "message", "No se proporcionaron los datos del proceso"
                ));
            }
            
            // Crear objeto ProcessData desde los datos recibidos
            ProcessData processDataObj = new ProcessData();
            
            // Mapear campos básicos
            processDataObj.setNumeroRadicacion((String) processData.get("numero_radicacion"));
            processDataObj.setFechaRadicacion((String) processData.get("fecha_radicacion"));
            processDataObj.setFechaProceso((String) processData.get("fecha_proceso"));
            processDataObj.setFechaUltimaActuacion((String) processData.get("fecha_ultima_actuacion"));
            
            processDataObj.setDespacho((String) processData.get("despacho"));
            processDataObj.setDepartamento((String) processData.get("departamento"));
            processDataObj.setTipoProceso((String) processData.get("tipo_proceso"));
            
            processDataObj.setDemandante((String) processData.get("demandante"));
            processDataObj.setDemandado((String) processData.get("demandado"));
            processDataObj.setSujetosProcesales((String) processData.get("sujetos_procesales"));
            
            // Campos numéricos y booleanos con valores por defecto
            processDataObj.setCantidadFolios(processData.get("cantidad_folios") != null ? 
                ((Number) processData.get("cantidad_folios")).intValue() : 0);
            processDataObj.setEsPrivado(processData.get("es_privado") != null ? 
                (Boolean) processData.get("es_privado") : false);
            processDataObj.setEstado((String) processData.get("estado"));
            processDataObj.setPortalUrl((String) processData.get("portal_url"));
            
            // Mapear actuaciones si existen
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> actuacionesData = (List<Map<String, Object>>) processData.get("actuaciones");
            if (actuacionesData != null) {
                List<ProcessActivity> actuaciones = new ArrayList<>();
                for (Map<String, Object> actData : actuacionesData) {
                    ProcessActivity activity = new ProcessActivity();
                    activity.setIdActuacion(actData.get("idActuacion") != null ? 
                        ((Number) actData.get("idActuacion")).longValue() : null);
                    activity.setConsActuacion(actData.get("consActuacion") != null ? 
                        ((Number) actData.get("consActuacion")).longValue() : null);
                    activity.setFechaActuacion((String) actData.get("fechaActuacion"));
                    activity.setActuacion((String) actData.get("actuacion"));
                    activity.setAnotacion((String) actData.get("anotacion"));
                    activity.setFechaInicioTermino((String) actData.get("fechaInicioTermino"));
                    activity.setFechaFinalizaTermino((String) actData.get("fechaFinalizaTermino"));
                    activity.setCodigoRegla((String) actData.get("codigoRegla"));
                    activity.setConDocumentos(actData.get("conDocumentos") != null ? 
                        (Boolean) actData.get("conDocumentos") : false);
                    activity.setCantFolios(actData.get("cantFolios") != null ? 
                        ((Number) actData.get("cantFolios")).intValue() : 0);
                    actuaciones.add(activity);
                }
                processDataObj.setActuaciones(actuaciones);
            }
            
            // Mapear sujetos si existen
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> sujetosData = (List<Map<String, Object>>) processData.get("sujetos");
            if (sujetosData != null) {
                List<ProcessSubject> sujetos = new ArrayList<>();
                for (Map<String, Object> sujData : sujetosData) {
                    ProcessSubject subject = new ProcessSubject();
                    subject.setIdSujetoProceso(sujData.get("lnIdSujetoProceso") != null ? 
                        ((Number) sujData.get("lnIdSujetoProceso")).longValue() : null);
                    subject.setNombreSujeto((String) sujData.get("lsNombreSujeto"));
                    subject.setTipoSujeto((String) sujData.get("lsTipoSujeto"));
                    subject.setIdentificacion((String) sujData.get("lsIdentificacion"));
                    subject.setTipoIdentificacion((String) sujData.get("lsTipoIdentificacion"));
                    subject.setApoderado((String) sujData.get("lsApoderado"));
                    subject.setTieneApoderado("S".equals(sujData.get("lbTieneApoderado")));
                    sujetos.add(subject);
                }
                processDataObj.setSujetos(sujetos);
            }
            
            // Guardar en la base de datos usando el servicio existente
            String processId = scrapingService.saveProcessData(processDataObj);
            
            if (processId != null) {
                // Log the save operation with user ID if authenticated
                judicialService.logConsultation(userId, processId, "frontend_save", 
                    httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), "success", null);
                
                logger.info("Process {} saved successfully with ID: {} by user: {}", 
                    processDataObj.getNumeroRadicacion(), processId, userId != null ? userId : "anonymous");
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Proceso guardado exitosamente en la base de datos",
                    "processId", processId
                ));
            } else {
                return ResponseEntity.status(500).body(Map.of(
                    "error", "Error guardando proceso",
                    "message", "No se pudo guardar el proceso en la base de datos"
                ));
            }
            
        } catch (Exception error) {
            logger.error("Error saving process data:", error);
            
            // Extract user ID from authentication if available
            String userId = (authentication != null && authentication.isAuthenticated()) 
                ? (String) authentication.getPrincipal() : null;
            
            judicialService.logConsultation(userId, null, "frontend_save", 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), "error", error.getMessage());
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "message", "Error al guardar el proceso: " + error.getMessage()
            ));
        }
    }
    
    /**
     * GET /api/judicial/search - Search processes by various criteria
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchProcesses(
            @RequestParam(value = "q", required = false) String generalQuery,
            @RequestParam(value = "despacho", required = false) String despacho,
            @RequestParam(value = "demandante", required = false) String demandante,
            @RequestParam(value = "demandado", required = false) String demandado,
            @RequestParam(value = "tipo", required = false) String tipo,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        
        try {
            logger.info("Public search request - q: {}, despacho: {}, demandante: {}, demandado: {}, tipo: {}, page: {}, limit: {}", 
                       generalQuery, despacho, demandante, demandado, tipo, page, limit);
            
            // Build search filters
            Map<String, Object> filters = new HashMap<>();
            
            if (despacho != null && !despacho.trim().isEmpty()) {
                filters.put("despacho", despacho.trim());
            }
            if (demandante != null && !demandante.trim().isEmpty()) {
                filters.put("demandante", demandante.trim());
            }
            if (demandado != null && !demandado.trim().isEmpty()) {
                filters.put("demandado", demandado.trim());
            }
            if (tipo != null && !tipo.trim().isEmpty()) {
                filters.put("tipo_proceso", tipo.trim());
            }
            
            // Limit max results to 50
            int effectiveLimit = Math.min(limit, 50);
            
            JsonNode results;
            
            if (generalQuery != null && !generalQuery.trim().isEmpty()) {
                // Use text search functionality - this would require implementing text search in SupabaseService
                // For now, we'll do a basic search
                results = judicialService.searchProcessesByText(generalQuery.trim(), page, effectiveLimit);
            } else {
                // Filter-based search
                results = judicialService.searchProcessesByFilters(filters, page, effectiveLimit);
            }
            
            List<Map<String, Object>> processResults = new ArrayList<>();
            if (results != null && results.isArray()) {
                for (JsonNode processNode : results) {
                    Map<String, Object> processMap = new HashMap<>();
                    processMap.put("numero_radicacion", processNode.get("numero_radicacion").asText());
                    processMap.put("fecha_radicacion", processNode.has("fecha_radicacion") ? processNode.get("fecha_radicacion").asText() : null);
                    processMap.put("despacho", processNode.has("despacho") ? processNode.get("despacho").asText() : null);
                    processMap.put("demandante", processNode.has("demandante") ? processNode.get("demandante").asText() : null);
                    processMap.put("demandado", processNode.has("demandado") ? processNode.get("demandado").asText() : null);
                    processMap.put("tipo_proceso", processNode.has("tipo_proceso") ? processNode.get("tipo_proceso").asText() : null);
                    processResults.add(processMap);
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", processResults,
                "pagination", Map.of(
                    "page", page,
                    "limit", effectiveLimit,
                    "total", processResults.size()
                )
            ));
            
        } catch (Exception error) {
            logger.error("Process search error:", error);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "message", "Error al buscar procesos"
            ));
        }
    }
    
    /**
     * GET /api/judicial/{numeroRadicacion}/activities - Get process activities
     */
    @GetMapping("/{numeroRadicacion}/activities")
    public ResponseEntity<?> getProcessActivities(@PathVariable String numeroRadicacion) {
        try {
            // Find process
            String processId = scrapingService.processExists(numeroRadicacion);
            if (processId == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Proceso no encontrado"));
            }
            
            // Get activities
            List<ProcessActivity> activities = judicialService.getProcessActivities(processId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", activities != null ? activities : new ArrayList<>()
            ));
            
        } catch (Exception error) {
            logger.error("Get activities error:", error);
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }
    
    /**
     * GET /api/judicial/{numeroRadicacion}/subjects - Get process subjects
     */
    @GetMapping("/{numeroRadicacion}/subjects")
    public ResponseEntity<?> getProcessSubjects(@PathVariable String numeroRadicacion) {
        try {
            // Find process
            String processId = scrapingService.processExists(numeroRadicacion);
            if (processId == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Proceso no encontrado"));
            }
            
            // Get subjects
            List<ProcessSubject> subjects = judicialService.getProcessSubjects(processId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", subjects != null ? subjects : new ArrayList<>()
            ));
            
        } catch (Exception error) {
            logger.error("Get subjects error:", error);
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }
    
    // AUTHENTICATED ROUTES - Require authentication
    
    /**
     * GET /api/judicial/consultation-history - Get user's consultation history
     */
    @GetMapping("/consultation-history")
    public ResponseEntity<?> getConsultationHistory(Authentication authentication,
                                                    @RequestParam(value = "limit", defaultValue = "10") int limit) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }
            
            String userId = (String) authentication.getPrincipal();
            
            // Get user's consultation history
            List<Map<String, Object>> history = judicialService.getUserConsultationHistory(userId, limit);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", history != null ? history : new ArrayList<>()
            ));
            
        } catch (Exception error) {
            logger.error("Get consultation history error:", error);
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }
    
    /**
     * GET /api/judicial/monitored - Get user's monitored processes
     */
    @GetMapping("/monitored")
    public ResponseEntity<?> getMonitoredProcesses(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }
            
            String userId = (String) authentication.getPrincipal();
            
            // Get user's monitored processes
            List<Map<String, Object>> userProcesses = judicialService.getUserProcesses(userId);
            
            if (userProcesses == null || userProcesses.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", new ArrayList<>(),
                    "message", "No tienes procesos monitoreados"
                ));
            }
            
            // Get process details for each monitored process
            List<Map<String, Object>> processes = new ArrayList<>();
            
            for (Map<String, Object> userProcess : userProcesses) {
                String processId = userProcess.get("process_id").toString();
                ProcessData processData = judicialService.getProcessFromDatabase(processId);
                
                if (processData != null) {
                    Map<String, Object> processMap = judicialService.convertProcessDataToMap(processData);
                    processMap.put("monitoring_info", Map.of(
                        "role", userProcess.get("role"),
                        "alias", userProcess.get("alias"),
                        "added_at", userProcess.get("created_at")
                    ));
                    processes.add(processMap);
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", processes
            ));
            
        } catch (Exception error) {
            logger.error("Get user processes error:", error);
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }
    
    /**
     * POST /api/judicial/monitor - Add a process to user's monitoring list
     */
    @PostMapping("/monitor")
    public ResponseEntity<?> monitorProcess(@Valid @RequestBody ProcessMonitorRequest request, 
                                          Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }
            
            String userId = (String) authentication.getPrincipal();
            String numeroRadicacion = request.getNumeroRadicacion();
            String role = request.getRole() != null ? request.getRole() : "observer";
            String alias = request.getAlias();
            
            // Check if process exists or scrape it
            String processId = scrapingService.processExists(numeroRadicacion);
            
            if (processId == null) {
                // Scrape the process first
                ProcessData processData = scrapingService.scrapeProcessData(numeroRadicacion);
                
                if (processData == null) {
                    return ResponseEntity.status(404).body(Map.of(
                        "error", "Proceso no encontrado",
                        "message", "No se pudo obtener información del proceso"
                    ));
                }
                
                processId = scrapingService.saveProcessData(processData);
            }
            
            // Check if user is already monitoring this process
            boolean isAlreadyMonitoring = judicialService.isUserMonitoringProcess(userId, processId);
            
            if (isAlreadyMonitoring) {
                return ResponseEntity.status(400).body(Map.of(
                    "error", "Proceso ya monitoreado",
                    "message", "Ya estás monitoreando este proceso"
                ));
            }
            
            // Add to monitoring
            boolean success = judicialService.addProcessMonitoring(userId, processId, role, alias);
            
            if (!success) {
                return ResponseEntity.status(500).body(Map.of(
                    "error", "Error interno",
                    "message", "No se pudo agregar el proceso al monitoreo"
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Proceso agregado al monitoreo exitosamente"
            ));
            
        } catch (Exception error) {
            logger.error("Monitor process error:", error);
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }
    
    /**
     * DELETE /api/judicial/monitor/{numeroRadicacion} - Remove from monitoring
     */
    @DeleteMapping("/monitor/{numeroRadicacion}")
    public ResponseEntity<?> unmonitorProcess(@PathVariable String numeroRadicacion, 
                                            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }
            
            String userId = (String) authentication.getPrincipal();
            
            // Find process
            String processId = scrapingService.processExists(numeroRadicacion);
            if (processId == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Proceso no encontrado"));
            }
            
            // Remove from monitoring
            boolean success = judicialService.removeProcessMonitoring(userId, processId);
            
            if (!success) {
                return ResponseEntity.status(500).body(Map.of(
                    "error", "Error interno",
                    "message", "No se pudo remover el proceso del monitoreo"
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Proceso removido del monitoreo"
            ));
            
        } catch (Exception error) {
            logger.error("Unmonitor process error:", error);
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }
}