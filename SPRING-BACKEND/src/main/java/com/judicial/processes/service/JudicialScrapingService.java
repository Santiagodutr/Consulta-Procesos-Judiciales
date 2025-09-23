package com.judicial.processes.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.judicial.processes.dto.ProcessActivity;
import com.judicial.processes.dto.ProcessData;
import com.judicial.processes.dto.ProcessDocument;
import com.judicial.processes.dto.ProcessSubject;

@Service
public class JudicialScrapingService {
    
    private static final Logger logger = LoggerFactory.getLogger(JudicialScrapingService.class);
    
    private static final String BASE_URL = "https://consultaprocesos.ramajudicial.gov.co";
    private static final String API_BASE = BASE_URL + "/api";
    private static final String PORTAL_API_URL = "https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion";
    private static final String ACTIVITIES_API_URL = "https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones";
    
    @Autowired
    private SupabaseService supabaseService;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * Main method to scrape process data from Colombian judicial portal
     */
    public ProcessData scrapeProcessData(String numeroRadicacion) {
        return scrapeProcessData(numeroRadicacion, false);
    }
    
    public ProcessData scrapeProcessData(String numeroRadicacion, Boolean soloActivos) {
        try {
            logger.info("Starting API consultation for process: {} (soloActivos: {})", numeroRadicacion, soloActivos);
            
            // Step 1: Get process basic information
            ProcessData basicInfo = getProcessBasicInfo(numeroRadicacion, soloActivos);
            if (basicInfo == null) {
                logger.warn("No basic info found for process: {}", numeroRadicacion);
                return null;
            }
            
            // Step 2: Get process activities (actuaciones)
            List<ProcessActivity> activities = getProcessActivities(numeroRadicacion);
            basicInfo.setActuaciones(activities);
            
            // Step 3: Get process subjects (sujetos procesales)
            List<ProcessSubject> subjects = getProcessSubjects(numeroRadicacion);
            basicInfo.setSujetos(subjects);
            
            // Step 4: Get process documents
            List<ProcessDocument> documents = getProcessDocuments(numeroRadicacion, activities);
            basicInfo.setDocumentos(documents);
            
            if (basicInfo.getNumeroRadicacion() == null || basicInfo.getNumeroRadicacion().isEmpty()) {
                logger.warn("Invalid basic info for process: {}", numeroRadicacion);
                return null;
            }
            
            logger.info("Successfully scraped data for process: {}", numeroRadicacion);
            return basicInfo;
            
        } catch (Exception error) {
            logger.error("Error scraping process {}: {}", numeroRadicacion, error.getMessage(), error);
            return null;
        }
    }
    
    /**
     * Get basic process information using the real API endpoint from the portal
     */
    private ProcessData getProcessBasicInfo(String numeroRadicacion) {
        return getProcessBasicInfo(numeroRadicacion, false);
    }
    
    private ProcessData getProcessBasicInfo(String numeroRadicacion, Boolean soloActivos) {
        try {
            // Build the request URL
            UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(PORTAL_API_URL)
                .queryParam("numero", numeroRadicacion.trim())
                .queryParam("SoloActivos", soloActivos != null ? soloActivos : false)
                .queryParam("pagina", 1);
            
            // Set headers to mimic browser request
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Accept-Language", "es-ES,es;q=0.9,en;q=0.8");
            headers.set("Referer", "https://consultaprocesos.ramajudicial.gov.co/");
            headers.set("Origin", "https://consultaprocesos.ramajudicial.gov.co");
            headers.set("Connection", "keep-alive");
            headers.set("Sec-Fetch-Dest", "empty");
            headers.set("Sec-Fetch-Mode", "cors");
            headers.set("Sec-Fetch-Site", "same-site");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            logger.debug("Making request to portal API: {}", uriBuilder.toUriString());
            
            ResponseEntity<String> response = restTemplate.exchange(
                uriBuilder.toUriString(),
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                if (responseJson.has("procesos") && responseJson.get("procesos").isArray() 
                    && responseJson.get("procesos").size() > 0) {
                    
                    JsonNode proceso = responseJson.get("procesos").get(0);
                    
                    // Extract demandante and demandado from sujetosProcesales field
                    String demandante = "NO DISPONIBLE";
                    String demandado = "NO DISPONIBLE";
                    
                    if (proceso.has("sujetosProcesales") && !proceso.get("sujetosProcesales").isNull()) {
                        String sujetos = proceso.get("sujetosProcesales").asText();
                        
                        // Extract demandante
                        Pattern demandantePattern = Pattern.compile("Demandante:\\s*([^|]+)", Pattern.CASE_INSENSITIVE);
                        Matcher demandanteMatcher = demandantePattern.matcher(sujetos);
                        if (demandanteMatcher.find()) {
                            demandante = demandanteMatcher.group(1).trim();
                        }
                        
                        // Extract demandado
                        Pattern demandadoPattern = Pattern.compile("Demandado:\\s*([^|]+)", Pattern.CASE_INSENSITIVE);
                        Matcher demandadoMatcher = demandadoPattern.matcher(sujetos);
                        if (demandadoMatcher.find()) {
                            demandado = demandadoMatcher.group(1).trim();
                        }
                    }
                    
                    ProcessData processData = new ProcessData();
                    
                    // Portal API fields
                    processData.setIdProceso(proceso.has("idProceso") ? proceso.get("idProceso").asLong() : null);
                    processData.setIdConexion(proceso.has("idConexion") ? proceso.get("idConexion").asLong() : null);
                    processData.setNumeroRadicacion(proceso.has("llaveProceso") ? proceso.get("llaveProceso").asText() : numeroRadicacion);
                    
                    // Date fields
                    if (proceso.has("fechaProceso") && !proceso.get("fechaProceso").isNull()) {
                        String fechaProceso = proceso.get("fechaProceso").asText();
                        processData.setFechaRadicacion(fechaProceso.contains("T") ? fechaProceso.split("T")[0] : fechaProceso);
                        processData.setFechaProceso(fechaProceso);
                    }
                    
                    if (proceso.has("fechaUltimaActuacion") && !proceso.get("fechaUltimaActuacion").isNull()) {
                        processData.setFechaUltimaActuacion(proceso.get("fechaUltimaActuacion").asText());
                    }
                    
                    // Court and case info
                    processData.setDespacho(proceso.has("despacho") ? proceso.get("despacho").asText() : "DESPACHO NO DISPONIBLE");
                    processData.setDepartamento(proceso.has("departamento") ? proceso.get("departamento").asText() : null);
                    processData.setTipoProceso(proceso.has("departamento") ? proceso.get("departamento").asText() : "TIPO NO DISPONIBLE");
                    
                    // Parties information
                    processData.setDemandante(demandante);
                    processData.setDemandado(demandado);
                    processData.setSujetosProcesales(proceso.has("sujetosProcesales") ? proceso.get("sujetosProcesales").asText() : null);
                    
                    // Process metadata
                    processData.setCantidadFolios(proceso.has("cantFilas") ? proceso.get("cantFilas").asInt() : 0);
                    processData.setEsPrivado(proceso.has("esPrivado") && proceso.get("esPrivado").asBoolean());
                    processData.setEstado("Activo"); // Default state for new processes
                    processData.setPortalUrl(BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion);
                    
                    return processData;
                }
            }
            
            return null;
            
        } catch (Exception error) {
            logger.error("Error getting basic info for {}: {}", numeroRadicacion, error.getMessage());
            
            // Fallback to basic data if API fails
            ProcessData fallback = new ProcessData();
            fallback.setNumeroRadicacion(numeroRadicacion);
            fallback.setFechaRadicacion(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            fallback.setDespacho("CONSULTADO - API NO DISPONIBLE");
            fallback.setDemandante("PROCESO ENCONTRADO");
            fallback.setDemandado("PROCESO ENCONTRADO");
            fallback.setTipoProceso("CONSULTA REALIZADA");
            fallback.setEsPrivado(false);
            fallback.setPortalUrl(BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion);
            
            return fallback;
        }
    }
    
    /**
     * Get process activities/actuaciones using real API
     */
    private List<ProcessActivity> getProcessActivities(String numeroRadicacion) {
        try {
            // Build the request URL
            UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(ACTIVITIES_API_URL)
                .queryParam("numero", numeroRadicacion.trim())
                .queryParam("pagina", 1);
            
            // Set headers to mimic browser request
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Accept-Language", "es-ES,es;q=0.9,en;q=0.8");
            headers.set("Referer", "https://consultaprocesos.ramajudicial.gov.co/");
            headers.set("Origin", "https://consultaprocesos.ramajudicial.gov.co");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                uriBuilder.toUriString(),
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                if (responseJson.has("actuaciones") && responseJson.get("actuaciones").isArray()) {
                    List<ProcessActivity> activities = new ArrayList<>();
                    
                    for (JsonNode actNode : responseJson.get("actuaciones")) {
                        ProcessActivity activity = new ProcessActivity();
                        
                        activity.setIdActuacion(actNode.has("idActuacion") ? actNode.get("idActuacion").asLong() : null);
                        activity.setConsActuacion(actNode.has("consActuacion") ? actNode.get("consActuacion").asLong() : null);
                        activity.setFechaActuacion(actNode.has("fechaActuacion") ? actNode.get("fechaActuacion").asText() : null);
                        activity.setActuacion(actNode.has("actuacion") ? actNode.get("actuacion").asText() : null);
                        activity.setAnotacion(actNode.has("anotacion") ? actNode.get("anotacion").asText() : null);
                        activity.setFechaInicioTermino(actNode.has("fechaInicioTermino") ? actNode.get("fechaInicioTermino").asText() : null);
                        activity.setFechaFinalizaTermino(actNode.has("fechaFinalizaTermino") ? actNode.get("fechaFinalizaTermino").asText() : null);
                        activity.setCodigoRegla(actNode.has("codigoRegla") ? actNode.get("codigoRegla").asText() : null);
                        activity.setConDocumentos(actNode.has("conDocumentos") && actNode.get("conDocumentos").asBoolean());
                        activity.setCantFolios(actNode.has("cantFolios") ? actNode.get("cantFolios").asInt() : 0);
                        
                        activities.add(activity);
                    }
                    
                    return activities;
                }
            }
            
            return new ArrayList<>();
        } catch (Exception error) {
            logger.error("Error getting activities for {}: {}", numeroRadicacion, error.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get process subjects/sujetos procesales
     */
    private List<ProcessSubject> getProcessSubjects(String numeroRadicacion) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("lsNroRadicacion", numeroRadicacion.trim());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Referer", BASE_URL);
            headers.set("Origin", BASE_URL);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                API_BASE + "/v1/Process/GetSujetosProcesales",
                HttpMethod.POST,
                entity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                if (responseJson.has("isSuccess") && responseJson.get("isSuccess").asBoolean() 
                    && responseJson.has("lsData") && responseJson.get("lsData").isArray()) {
                    
                    List<ProcessSubject> subjects = new ArrayList<>();
                    
                    for (JsonNode subjectNode : responseJson.get("lsData")) {
                        ProcessSubject subject = new ProcessSubject();
                        
                        subject.setIdSujetoProceso(subjectNode.has("lnIdSujetoProceso") ? subjectNode.get("lnIdSujetoProceso").asLong() : null);
                        subject.setNombreSujeto(subjectNode.has("lsNombreSujeto") ? subjectNode.get("lsNombreSujeto").asText() : null);
                        subject.setTipoSujeto(subjectNode.has("lsTipoSujeto") ? subjectNode.get("lsTipoSujeto").asText() : null);
                        subject.setIdentificacion(subjectNode.has("lsIdentificacion") ? subjectNode.get("lsIdentificacion").asText() : null);
                        subject.setTipoIdentificacion(subjectNode.has("lsTipoIdentificacion") ? subjectNode.get("lsTipoIdentificacion").asText() : null);
                        subject.setApoderado(subjectNode.has("lsApoderado") ? subjectNode.get("lsApoderado").asText() : null);
                        subject.setTieneApoderado(subjectNode.has("lbTieneApoderado") && "S".equals(subjectNode.get("lbTieneApoderado").asText()));
                        
                        subjects.add(subject);
                    }
                    
                    return subjects;
                }
            }
            
            return new ArrayList<>();
        } catch (Exception error) {
            logger.error("Error getting subjects for {}: {}", numeroRadicacion, error.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get process documents
     */
    private List<ProcessDocument> getProcessDocuments(String numeroRadicacion, List<ProcessActivity> activities) {
        try {
            List<ProcessDocument> documents = new ArrayList<>();
            
            for (ProcessActivity activity : activities) {
                if (Boolean.TRUE.equals(activity.getConDocumentos()) && activity.getIdActuacion() != null) {
                    List<ProcessDocument> activityDocs = getDocumentsForActivity(numeroRadicacion, activity.getIdActuacion());
                    documents.addAll(activityDocs);
                }
            }
            
            return documents;
        } catch (Exception error) {
            logger.error("Error getting documents for {}: {}", numeroRadicacion, error.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get documents for a specific activity
     */
    private List<ProcessDocument> getDocumentsForActivity(String numeroRadicacion, Long idActuacion) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("lsNroRadicacion", numeroRadicacion.trim());
            requestBody.put("lnIdActuacion", idActuacion);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Referer", BASE_URL);
            headers.set("Origin", BASE_URL);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                API_BASE + "/Process/GetDocumentos",
                HttpMethod.POST,
                entity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                if (responseJson.has("isSuccess") && responseJson.get("isSuccess").asBoolean() 
                    && responseJson.has("lsData") && responseJson.get("lsData").isArray()) {
                    
                    List<ProcessDocument> documents = new ArrayList<>();
                    
                    for (JsonNode docNode : responseJson.get("lsData")) {
                        ProcessDocument document = new ProcessDocument();
                        
                        document.setIdDocumento(docNode.has("lnIdDocumento") ? docNode.get("lnIdDocumento").asLong() : null);
                        document.setNombreArchivo(docNode.has("lsNombreArchivo") ? docNode.get("lsNombreArchivo").asText() : null);
                        document.setTipoDocumento(docNode.has("lsTipoDocumento") ? docNode.get("lsTipoDocumento").asText() : null);
                        document.setUrlDescarga(docNode.has("lsUrlDescarga") ? docNode.get("lsUrlDescarga").asText() : null);
                        document.setTamanoArchivo(docNode.has("lnTamanoArchivo") ? docNode.get("lnTamanoArchivo").asLong() : null);
                        document.setExtensionArchivo(docNode.has("lsExtensionArchivo") ? docNode.get("lsExtensionArchivo").asText() : null);
                        document.setFechaDocumento(docNode.has("ldFechaDocumento") ? docNode.get("ldFechaDocumento").asText() : null);
                        
                        documents.add(document);
                    }
                    
                    return documents;
                }
            }
            
            return new ArrayList<>();
        } catch (Exception error) {
            logger.error("Error getting documents for activity {}: {}", idActuacion, error.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Save scraped process data to database using upsert
     */
    public String saveProcessData(ProcessData processData) {
        try {
            logger.info("Saving process data to database: {}", processData.getNumeroRadicacion());
            
            // Prepare process data for upsert
            Map<String, Object> processRecord = new HashMap<>();
            
            // Portal API fields
            processRecord.put("id_proceso", processData.getIdProceso());
            processRecord.put("id_conexion", processData.getIdConexion());
            processRecord.put("numero_radicacion", processData.getNumeroRadicacion());
            
            // Date fields
            processRecord.put("fecha_radicacion", processData.getFechaRadicacion());
            processRecord.put("fecha_proceso", processData.getFechaProceso());
            processRecord.put("fecha_ultima_actuacion", processData.getFechaUltimaActuacion());
            
            // Court and case info
            processRecord.put("despacho", processData.getDespacho());
            processRecord.put("departamento", processData.getDepartamento());
            processRecord.put("ponente", processData.getPonente());
            processRecord.put("ubicacion_expediente", processData.getUbicacionExpediente());
            processRecord.put("tipo_proceso", processData.getTipoProceso());
            processRecord.put("clase_proceso", processData.getClaseProceso());
            processRecord.put("subclase_proceso", processData.getSubclaseProceso());
            
            // Parties information
            processRecord.put("demandante", processData.getDemandante());
            processRecord.put("demandado", processData.getDemandado());
            processRecord.put("sujetos_procesales", processData.getSujetosProcesales());
            processRecord.put("apoderado_demandante", processData.getApoderadoDemandante());
            processRecord.put("apoderado_demandado", processData.getApoderadoDemandado());
            
            // Process metadata
            processRecord.put("cantidad_folios", processData.getCantidadFolios());
            processRecord.put("es_privado", processData.getEsPrivado() != null ? processData.getEsPrivado() : false);
            processRecord.put("estado", processData.getEstado() != null ? processData.getEstado() : "Activo");
            processRecord.put("solo_activos", processData.getSoloActivos() != null ? processData.getSoloActivos() : false);
            processRecord.put("portal_url", processData.getPortalUrl());
            
            // Timestamps
            processRecord.put("created_at", LocalDateTime.now().toString());
            processRecord.put("updated_at", LocalDateTime.now().toString());
            
            JsonNode result = supabaseService.upsert("judicial_processes", processRecord, "numero_radicacion");
            
            if (result == null) {
                logger.error("Error saving process data: No record returned");
                return null;
            }
            
            String processId = result.get(0).get("id").asText();
            
            // Save activities
            if (processData.getActuaciones() != null && !processData.getActuaciones().isEmpty()) {
                saveProcessActivities(processId, processData.getActuaciones());
            }
            
            // Save subjects
            if (processData.getSujetos() != null && !processData.getSujetos().isEmpty()) {
                saveProcessSubjects(processId, processData.getSujetos());
            }
            
            // Save documents
            if (processData.getDocumentos() != null && !processData.getDocumentos().isEmpty()) {
                saveProcessDocuments(processId, processData.getDocumentos());
            }
            
            logger.info("Successfully saved process data for: {}", processData.getNumeroRadicacion());
            return processId;
            
        } catch (Exception error) {
            logger.error("Error in saveProcessData: {}", error.getMessage(), error);
            return null;
        }
    }
    
    /**
     * Check if process exists in database
     */
    public String processExists(String numeroRadicacion) {
        try {
            Map<String, Object> filters = new HashMap<>();
            filters.put("numero_radicacion", numeroRadicacion);
            
            JsonNode data = supabaseService.select("judicial_processes", filters);
            
            if (data == null || !data.isArray() || data.size() == 0) {
                return null;
            }
            
            return data.get(0).get("id").asText();
        } catch (Exception error) {
            logger.error("Error checking if process exists: {}", error.getMessage());
            return null;
        }
    }
    
    // Helper methods for saving related data
    
    private void saveProcessActivities(String processId, List<ProcessActivity> activities) {
        try {
            logger.info("Saving {} activities for process {}", activities.size(), processId);
            
            // First, delete existing activities for this process to avoid duplicates
            Map<String, Object> deleteConditions = new HashMap<>();
            deleteConditions.put("process_id", processId);
            supabaseService.deleteWhere("process_activities", deleteConditions);
            
            for (ProcessActivity activity : activities) {
                Map<String, Object> activityRecord = new HashMap<>();
                activityRecord.put("process_id", processId);
                activityRecord.put("id_actuacion", activity.getIdActuacion());
                activityRecord.put("cons_actuacion", activity.getConsActuacion());
                activityRecord.put("fecha_actuacion", activity.getFechaActuacion());
                activityRecord.put("actuacion", activity.getActuacion());
                activityRecord.put("anotacion", activity.getAnotacion());
                activityRecord.put("fecha_inicio_termino", activity.getFechaInicioTermino());
                activityRecord.put("fecha_finaliza_termino", activity.getFechaFinalizaTermino());
                activityRecord.put("codigo_regla", activity.getCodigoRegla());
                activityRecord.put("con_documentos", activity.getConDocumentos());
                activityRecord.put("cant_folios", activity.getCantFolios());
                
                supabaseService.insert("process_activities", activityRecord);
            }
            
            logger.info("Successfully saved {} activities", activities.size());
        } catch (Exception error) {
            logger.error("Error saving activities: {}", error.getMessage());
        }
    }
    
    private void saveProcessSubjects(String processId, List<ProcessSubject> subjects) {
        try {
            logger.info("Saving {} subjects for process {}", subjects.size(), processId);
            
            // First, delete existing subjects for this process to avoid duplicates
            Map<String, Object> deleteConditions = new HashMap<>();
            deleteConditions.put("process_id", processId);
            supabaseService.deleteWhere("process_subjects", deleteConditions);
            
            for (ProcessSubject subject : subjects) {
                Map<String, Object> subjectRecord = new HashMap<>();
                subjectRecord.put("process_id", processId);
                subjectRecord.put("id_sujeto_proceso", subject.getIdSujetoProceso());
                subjectRecord.put("nombre_sujeto", subject.getNombreSujeto());
                subjectRecord.put("tipo_sujeto", subject.getTipoSujeto());
                subjectRecord.put("identificacion", subject.getIdentificacion());
                subjectRecord.put("tipo_identificacion", subject.getTipoIdentificacion());
                subjectRecord.put("apoderado", subject.getApoderado());
                subjectRecord.put("tiene_apoderado", subject.getTieneApoderado());
                
                supabaseService.insert("process_subjects", subjectRecord);
            }
            
            logger.info("Successfully saved {} subjects", subjects.size());
        } catch (Exception error) {
            logger.error("Error saving subjects: {}", error.getMessage());
        }
    }
    
    private void saveProcessDocuments(String processId, List<ProcessDocument> documents) {
        try {
            logger.info("Saving {} documents for process {}", documents.size(), processId);
            
            // First, delete existing documents for this process to avoid duplicates
            Map<String, Object> deleteConditions = new HashMap<>();
            deleteConditions.put("process_id", processId);
            supabaseService.deleteWhere("process_documents", deleteConditions);
            
            for (ProcessDocument document : documents) {
                Map<String, Object> documentRecord = new HashMap<>();
                documentRecord.put("process_id", processId);
                documentRecord.put("actuacion_id", null); // Could be linked to specific activity later
                documentRecord.put("id_documento", document.getIdDocumento());
                documentRecord.put("nombre_archivo", document.getNombreArchivo());
                documentRecord.put("tipo_documento", document.getTipoDocumento());
                documentRecord.put("url_descarga", document.getUrlDescarga());
                documentRecord.put("tamano_archivo", document.getTamanoArchivo());
                documentRecord.put("extension_archivo", document.getExtensionArchivo());
                documentRecord.put("fecha_documento", document.getFechaDocumento());
                
                supabaseService.insert("process_documents", documentRecord);
            }
            
            logger.info("Successfully saved {} documents", documents.size());
        } catch (Exception error) {
            logger.error("Error saving documents: {}", error.getMessage());
        }
    }
}