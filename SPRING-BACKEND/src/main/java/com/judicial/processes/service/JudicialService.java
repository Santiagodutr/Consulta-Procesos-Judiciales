package com.judicial.processes.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.judicial.processes.dto.ProcessActivity;
import com.judicial.processes.dto.ProcessData;
import com.judicial.processes.dto.ProcessDocument;
import com.judicial.processes.dto.ProcessSubject;

@Service
public class JudicialService {
    
    private static final Logger logger = LoggerFactory.getLogger(JudicialService.class);
    
    @Autowired
    private SupabaseService supabaseService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * Get process from database with all related data
     */
    public ProcessData getProcessFromDatabase(String processId) {
        try {
            // Get main process info
            Map<String, Object> filters = new HashMap<>();
            filters.put("id", processId);
            
            JsonNode processes = supabaseService.select("judicial_processes", filters);
            
            if (processes == null || !processes.isArray() || processes.size() == 0) {
                return null;
            }
            
            JsonNode processNode = processes.get(0);
            
            // Convert JsonNode to ProcessData
            ProcessData processData = convertJsonToProcessData(processNode);
            
            // Get related data
            List<ProcessActivity> activities = getProcessActivities(processId);
            List<ProcessSubject> subjects = getProcessSubjects(processId);
            List<ProcessDocument> documents = getProcessDocuments(processId);
            
            processData.setActuaciones(activities);
            processData.setSujetos(subjects);
            processData.setDocumentos(documents);
            
            return processData;
        } catch (Exception error) {
            logger.error("Error getting process from database: {}", error.getMessage());
            return null;
        }
    }
    
    /**
     * Get process activities from database
     */
    public List<ProcessActivity> getProcessActivities(String processId) {
        try {
            Map<String, Object> filters = new HashMap<>();
            filters.put("process_id", processId);
            
            JsonNode activities = supabaseService.select("process_activities", filters);
            
            if (activities == null || !activities.isArray()) {
                return new ArrayList<>();
            }
            
            List<ProcessActivity> result = new ArrayList<>();
            for (JsonNode actNode : activities) {
                ProcessActivity activity = convertJsonToProcessActivity(actNode);
                result.add(activity);
            }
            
            return result;
        } catch (Exception error) {
            logger.error("Error getting process activities: {}", error.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get process subjects from database
     */
    public List<ProcessSubject> getProcessSubjects(String processId) {
        try {
            Map<String, Object> filters = new HashMap<>();
            filters.put("process_id", processId);
            
            JsonNode subjects = supabaseService.select("process_subjects", filters);
            
            if (subjects == null || !subjects.isArray()) {
                return new ArrayList<>();
            }
            
            List<ProcessSubject> result = new ArrayList<>();
            for (JsonNode subjectNode : subjects) {
                ProcessSubject subject = convertJsonToProcessSubject(subjectNode);
                result.add(subject);
            }
            
            return result;
        } catch (Exception error) {
            logger.error("Error getting process subjects: {}", error.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get process documents from database
     */
    public List<ProcessDocument> getProcessDocuments(String processId) {
        try {
            Map<String, Object> filters = new HashMap<>();
            filters.put("process_id", processId);
            
            JsonNode documents = supabaseService.select("process_documents", filters);
            
            if (documents == null || !documents.isArray()) {
                return new ArrayList<>();
            }
            
            List<ProcessDocument> result = new ArrayList<>();
            for (JsonNode docNode : documents) {
                ProcessDocument document = convertJsonToProcessDocument(docNode);
                result.add(document);
            }
            
            return result;
        } catch (Exception error) {
            logger.error("Error getting process documents: {}", error.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Search processes by text query (placeholder implementation)
     */
    public JsonNode searchProcessesByText(String query, int page, int limit) {
        try {
            // This is a simplified implementation - in a real scenario,
            // you'd use PostgreSQL's full-text search capabilities
            // For now, we'll search in multiple fields
            
            JsonNode allProcesses = supabaseService.select("judicial_processes", new HashMap<>());
            
            if (allProcesses == null || !allProcesses.isArray()) {
                return null;
            }
            
            List<JsonNode> filteredResults = new ArrayList<>();
            String lowerQuery = query.toLowerCase();
            
            for (JsonNode process : allProcesses) {
                String demandante = process.has("demandante") ? process.get("demandante").asText().toLowerCase() : "";
                String demandado = process.has("demandado") ? process.get("demandado").asText().toLowerCase() : "";
                String despacho = process.has("despacho") ? process.get("despacho").asText().toLowerCase() : "";
                String numeroRadicacion = process.has("numero_radicacion") ? process.get("numero_radicacion").asText().toLowerCase() : "";
                
                if (demandante.contains(lowerQuery) || demandado.contains(lowerQuery) || 
                    despacho.contains(lowerQuery) || numeroRadicacion.contains(lowerQuery)) {
                    filteredResults.add(process);
                }
            }
            
            // Apply pagination
            int offset = (page - 1) * limit;
            int endIndex = Math.min(offset + limit, filteredResults.size());
            
            if (offset < filteredResults.size()) {
                List<JsonNode> paginatedResults = filteredResults.subList(offset, endIndex);
                return objectMapper.valueToTree(paginatedResults);
            }
            
            return objectMapper.valueToTree(new ArrayList<>());
        } catch (Exception error) {
            logger.error("Error searching processes by text: {}", error.getMessage());
            return null;
        }
    }
    
    /**
     * Search processes by filters
     */
    public JsonNode searchProcessesByFilters(Map<String, Object> filters, int page, int limit) {
        try {
            JsonNode results = supabaseService.select("judicial_processes", filters);
            
            if (results == null || !results.isArray()) {
                return objectMapper.valueToTree(new ArrayList<>());
            }
            
            // Apply pagination
            int offset = (page - 1) * limit;
            int endIndex = Math.min(offset + limit, results.size());
            
            if (offset < results.size()) {
                List<JsonNode> paginatedResults = new ArrayList<>();
                for (int i = offset; i < endIndex; i++) {
                    paginatedResults.add(results.get(i));
                }
                return objectMapper.valueToTree(paginatedResults);
            }
            
            return objectMapper.valueToTree(new ArrayList<>());
        } catch (Exception error) {
            logger.error("Error searching processes by filters: {}", error.getMessage());
            return null;
        }
    }
    
    /**
     * Get user's monitored processes
     */
    public List<Map<String, Object>> getUserProcesses(String userId) {
        try {
            Map<String, Object> filters = new HashMap<>();
            filters.put("user_id", userId);
            
            JsonNode userProcesses = supabaseService.select("user_processes", filters);
            
            if (userProcesses == null || !userProcesses.isArray()) {
                return new ArrayList<>();
            }
            
            List<Map<String, Object>> result = new ArrayList<>();
            for (JsonNode userProcess : userProcesses) {
                Map<String, Object> processMap = new HashMap<>();
                processMap.put("process_id", userProcess.get("process_id").asText());
                processMap.put("role", userProcess.has("role") ? userProcess.get("role").asText() : "observer");
                processMap.put("alias", userProcess.has("alias") && !userProcess.get("alias").isNull() ? userProcess.get("alias").asText() : null);
                processMap.put("created_at", userProcess.has("created_at") ? userProcess.get("created_at").asText() : null);
                result.add(processMap);
            }
            
            return result;
        } catch (Exception error) {
            logger.error("Error getting user processes: {}", error.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Check if user is monitoring a process
     */
    public boolean isUserMonitoringProcess(String userId, String processId) {
        try {
            Map<String, Object> filters = new HashMap<>();
            filters.put("user_id", userId);
            filters.put("process_id", processId);
            
            JsonNode existingMonitoring = supabaseService.select("user_processes", filters);
            
            return existingMonitoring != null && existingMonitoring.isArray() && existingMonitoring.size() > 0;
        } catch (Exception error) {
            logger.error("Error checking if user is monitoring process: {}", error.getMessage());
            return false;
        }
    }
    
    /**
     * Add process monitoring for user
     */
    public boolean addProcessMonitoring(String userId, String processId, String role, String alias) {
        try {
            Map<String, Object> monitoringRecord = new HashMap<>();
            monitoringRecord.put("user_id", userId);
            monitoringRecord.put("process_id", processId);
            monitoringRecord.put("role", role);
            monitoringRecord.put("alias", alias);
            monitoringRecord.put("created_at", LocalDateTime.now().toString());
            
            JsonNode result = supabaseService.insert("user_processes", monitoringRecord);
            
            return result != null;
        } catch (Exception error) {
            logger.error("Error adding process monitoring: {}", error.getMessage());
            return false;
        }
    }
    
    /**
     * Remove process monitoring for user
     */
    public boolean removeProcessMonitoring(String userId, String processId) {
        try {
            Map<String, Object> conditions = new HashMap<>();
            conditions.put("user_id", userId);
            conditions.put("process_id", processId);
            
            return supabaseService.deleteWhere("user_processes", conditions);
        } catch (Exception error) {
            logger.error("Error removing process monitoring: {}", error.getMessage());
            return false;
        }
    }
    
    /**
     * Log consultation activity
     */
    public void logConsultation(String userId, String processId, String type, String ip, String userAgent, String status, String errorMessage) {
        try {
            Map<String, Object> consultationRecord = new HashMap<>();
            consultationRecord.put("user_id", userId);
            consultationRecord.put("process_id", processId);
            consultationRecord.put("consultation_type", type);
            consultationRecord.put("ip_address", ip);
            consultationRecord.put("user_agent", userAgent);
            consultationRecord.put("result_status", status);
            consultationRecord.put("error_message", errorMessage);
            consultationRecord.put("created_at", LocalDateTime.now().toString());
            
            supabaseService.insert("consultation_history", consultationRecord);
        } catch (Exception error) {
            logger.error("Error logging consultation: {}", error.getMessage());
        }
    }
    
    /**
     * Convert ProcessData to Map for JSON response
     */
    public Map<String, Object> convertProcessDataToMap(ProcessData processData) {
        Map<String, Object> map = new HashMap<>();
        
        if (processData == null) return map;
        
        map.put("id_proceso", processData.getIdProceso());
        map.put("id_conexion", processData.getIdConexion());
        map.put("numero_radicacion", processData.getNumeroRadicacion());
        map.put("fecha_radicacion", processData.getFechaRadicacion());
        map.put("fecha_proceso", processData.getFechaProceso());
        map.put("fecha_ultima_actuacion", processData.getFechaUltimaActuacion());
        map.put("despacho", processData.getDespacho());
        map.put("departamento", processData.getDepartamento());
        map.put("ponente", processData.getPonente());
        map.put("ubicacion_expediente", processData.getUbicacionExpediente());
        map.put("tipo_proceso", processData.getTipoProceso());
        map.put("clase_proceso", processData.getClaseProceso());
        map.put("subclase_proceso", processData.getSubclaseProceso());
        map.put("demandante", processData.getDemandante());
        map.put("demandado", processData.getDemandado());
        map.put("sujetos_procesales", processData.getSujetosProcesales());
        map.put("apoderado_demandante", processData.getApoderadoDemandante());
        map.put("apoderado_demandado", processData.getApoderadoDemandado());
        map.put("cantidad_folios", processData.getCantidadFolios());
        map.put("es_privado", processData.getEsPrivado());
        map.put("estado", processData.getEstado());
        map.put("solo_activos", processData.getSoloActivos());
        map.put("portal_url", processData.getPortalUrl());
        map.put("actuaciones", processData.getActuaciones());
        map.put("sujetos", processData.getSujetos());
        map.put("documentos", processData.getDocumentos());
        
        return map;
    }
    
    // Helper methods to convert JsonNode to DTOs
    
    private ProcessData convertJsonToProcessData(JsonNode node) {
        ProcessData processData = new ProcessData();
        
        if (node.has("id_proceso")) processData.setIdProceso(node.get("id_proceso").asLong());
        if (node.has("id_conexion")) processData.setIdConexion(node.get("id_conexion").asLong());
        if (node.has("numero_radicacion")) processData.setNumeroRadicacion(node.get("numero_radicacion").asText());
        if (node.has("fecha_radicacion")) processData.setFechaRadicacion(node.get("fecha_radicacion").asText());
        if (node.has("fecha_proceso")) processData.setFechaProceso(node.get("fecha_proceso").asText());
        if (node.has("fecha_ultima_actuacion")) processData.setFechaUltimaActuacion(node.get("fecha_ultima_actuacion").asText());
        if (node.has("despacho")) processData.setDespacho(node.get("despacho").asText());
        if (node.has("departamento")) processData.setDepartamento(node.get("departamento").asText());
        if (node.has("ponente")) processData.setPonente(node.get("ponente").asText());
        if (node.has("ubicacion_expediente")) processData.setUbicacionExpediente(node.get("ubicacion_expediente").asText());
        if (node.has("tipo_proceso")) processData.setTipoProceso(node.get("tipo_proceso").asText());
        if (node.has("clase_proceso")) processData.setClaseProceso(node.get("clase_proceso").asText());
        if (node.has("subclase_proceso")) processData.setSubclaseProceso(node.get("subclase_proceso").asText());
        if (node.has("demandante")) processData.setDemandante(node.get("demandante").asText());
        if (node.has("demandado")) processData.setDemandado(node.get("demandado").asText());
        if (node.has("sujetos_procesales")) processData.setSujetosProcesales(node.get("sujetos_procesales").asText());
        if (node.has("apoderado_demandante")) processData.setApoderadoDemandante(node.get("apoderado_demandante").asText());
        if (node.has("apoderado_demandado")) processData.setApoderadoDemandado(node.get("apoderado_demandado").asText());
        if (node.has("cantidad_folios")) processData.setCantidadFolios(node.get("cantidad_folios").asInt());
        if (node.has("es_privado")) processData.setEsPrivado(node.get("es_privado").asBoolean());
        if (node.has("estado")) processData.setEstado(node.get("estado").asText());
        if (node.has("solo_activos")) processData.setSoloActivos(node.get("solo_activos").asBoolean());
        if (node.has("portal_url")) processData.setPortalUrl(node.get("portal_url").asText());
        
        return processData;
    }
    
    private ProcessActivity convertJsonToProcessActivity(JsonNode node) {
        ProcessActivity activity = new ProcessActivity();
        
        if (node.has("id_actuacion")) activity.setIdActuacion(node.get("id_actuacion").asLong());
        if (node.has("cons_actuacion")) activity.setConsActuacion(node.get("cons_actuacion").asLong());
        if (node.has("fecha_actuacion")) activity.setFechaActuacion(node.get("fecha_actuacion").asText());
        if (node.has("actuacion")) activity.setActuacion(node.get("actuacion").asText());
        if (node.has("anotacion") && !node.get("anotacion").isNull()) activity.setAnotacion(node.get("anotacion").asText());
        if (node.has("fecha_inicio_termino") && !node.get("fecha_inicio_termino").isNull()) activity.setFechaInicioTermino(node.get("fecha_inicio_termino").asText());
        if (node.has("fecha_finaliza_termino") && !node.get("fecha_finaliza_termino").isNull()) activity.setFechaFinalizaTermino(node.get("fecha_finaliza_termino").asText());
        if (node.has("codigo_regla") && !node.get("codigo_regla").isNull()) activity.setCodigoRegla(node.get("codigo_regla").asText());
        if (node.has("con_documentos")) activity.setConDocumentos(node.get("con_documentos").asBoolean());
        if (node.has("cant_folios")) activity.setCantFolios(node.get("cant_folios").asInt());
        
        return activity;
    }
    
    private ProcessSubject convertJsonToProcessSubject(JsonNode node) {
        ProcessSubject subject = new ProcessSubject();
        
        if (node.has("id_sujeto_proceso")) subject.setIdSujetoProceso(node.get("id_sujeto_proceso").asLong());
        if (node.has("nombre_sujeto")) subject.setNombreSujeto(node.get("nombre_sujeto").asText());
        if (node.has("tipo_sujeto")) subject.setTipoSujeto(node.get("tipo_sujeto").asText());
        if (node.has("identificacion") && !node.get("identificacion").isNull()) subject.setIdentificacion(node.get("identificacion").asText());
        if (node.has("tipo_identificacion") && !node.get("tipo_identificacion").isNull()) subject.setTipoIdentificacion(node.get("tipo_identificacion").asText());
        if (node.has("apoderado") && !node.get("apoderado").isNull()) subject.setApoderado(node.get("apoderado").asText());
        if (node.has("tiene_apoderado")) subject.setTieneApoderado(node.get("tiene_apoderado").asBoolean());
        
        return subject;
    }
    
    private ProcessDocument convertJsonToProcessDocument(JsonNode node) {
        ProcessDocument document = new ProcessDocument();
        
        if (node.has("id_documento")) document.setIdDocumento(node.get("id_documento").asLong());
        if (node.has("nombre_archivo")) document.setNombreArchivo(node.get("nombre_archivo").asText());
        if (node.has("tipo_documento") && !node.get("tipo_documento").isNull()) document.setTipoDocumento(node.get("tipo_documento").asText());
        if (node.has("url_descarga") && !node.get("url_descarga").isNull()) document.setUrlDescarga(node.get("url_descarga").asText());
        if (node.has("tamano_archivo") && !node.get("tamano_archivo").isNull()) document.setTamanoArchivo(node.get("tamano_archivo").asLong());
        if (node.has("extension_archivo") && !node.get("extension_archivo").isNull()) document.setExtensionArchivo(node.get("extension_archivo").asText());
        if (node.has("fecha_documento") && !node.get("fecha_documento").isNull()) document.setFechaDocumento(node.get("fecha_documento").asText());
        
        return document;
    }
}