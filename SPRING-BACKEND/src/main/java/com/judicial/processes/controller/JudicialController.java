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
                                          HttpServletRequest httpRequest) {
        try {
            String numeroRadicacion = request.getNumeroRadicacion();
            
            logger.info("Public consultation for process: {}", numeroRadicacion);
            
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
                    return ResponseEntity.status(404).body(Map.of(
                        "error", "Proceso no encontrado",
                        "message", "No se encontró información del proceso en el portal oficial"
                    ));
                }
                
                // Save to database (this will update if exists due to upsert)
                processId = scrapingService.saveProcessData(processData);
                source = "portal";
            }
            
            // Log the consultation
            judicialService.logConsultation(null, processId, "public_consult", 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), "success", null);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", processData,
                "source", source
            ));
            
        } catch (Exception error) {
            logger.error("Process consultation error:", error);
            
            judicialService.logConsultation(null, null, "public_consult", 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), "error", error.getMessage());
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "message", "Error al consultar el proceso"
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