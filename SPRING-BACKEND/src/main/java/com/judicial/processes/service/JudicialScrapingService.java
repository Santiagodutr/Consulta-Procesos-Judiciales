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
     * Add headers that mimic the browser/frontend requests as closely as possible.
     */
    private void applyBrowserHeaders(HttpHeaders headers, String referer, String cookies, boolean includeHostWithPort) {
        if (headers == null) return;
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        headers.set("Accept", "application/json, text/plain, */*");
        headers.set("Accept-Language", "es-ES,es;q=0.9,en;q=0.8");
        if (referer != null) headers.set("Referer", referer);
        headers.set("Origin", BASE_URL);
        headers.set("Connection", "keep-alive");
        headers.set("Sec-Fetch-Dest", "empty");
        headers.set("Sec-Fetch-Mode", "cors");
        headers.set("Sec-Fetch-Site", "same-site");
        headers.set("X-Requested-With", "XMLHttpRequest");
        headers.set("Accept-Encoding", "gzip, deflate, br");

        // Client hints (may help bypass checks)
        headers.set("Sec-CH-UA", "\"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\", \"Not:A-Brand\";v=\"99\"");
        headers.set("Sec-CH-UA-Mobile", "?0");
        headers.set("Sec-CH-UA-Platform", "\"Windows\"");

        if (cookies != null) headers.set("Cookie", cookies);

        if (includeHostWithPort) {
            // When calling explicit :448 endpoints, set Host header to include port
            headers.set("Host", "consultaprocesos.ramajudicial.gov.co:448");
        }
    }
    
    /**
     * Main method to scrape process data from Colombian judicial portal
     */
    public ProcessData scrapeProcessData(String numeroRadicacion) {
        return scrapeProcessData(numeroRadicacion, false);
    }
    
    /**
     * Perform an initial GET to the portal page to collect cookies and return a Cookie header value.
     */
    private String fetchPortalCookies(String numeroRadicacion) {
        try {
            String url = BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion.trim();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
            headers.set("Accept-Language", "es-ES,es;q=0.9");
            headers.set("Referer", BASE_URL);

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            List<String> setCookies = response.getHeaders().get(HttpHeaders.SET_COOKIE);
            if (setCookies != null && !setCookies.isEmpty()) {
                StringBuilder cookieBuilder = new StringBuilder();
                for (String c : setCookies) {
                    int idx = c.indexOf(';');
                    String part = idx > 0 ? c.substring(0, idx) : c;
                    if (cookieBuilder.length() > 0) cookieBuilder.append("; ");
                    cookieBuilder.append(part);
                }
                logger.debug("Fetched portal cookies: {}", cookieBuilder.toString());
                return cookieBuilder.toString();
            }
        } catch (Exception e) {
            logger.debug("Could not fetch portal cookies: {}", e.getMessage());
        }
        return null;
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
            
            // Set headers to mimic browser request exactly as frontend
            String portalCookies = fetchPortalCookies(numeroRadicacion);
            HttpHeaders headers = new HttpHeaders();
            applyBrowserHeaders(headers, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, portalCookies, true);

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
        String portalCookies = null;
        try {
            // Try to obtain cookies by visiting the portal page first (helps bypass simple anti-bot checks)
            portalCookies = fetchPortalCookies(numeroRadicacion);

            // Build the request URL
            UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(ACTIVITIES_API_URL)
                .queryParam("numero", numeroRadicacion.trim())
                .queryParam("pagina", 1);
            
            // Set headers to mimic frontend browser request more closely
            HttpHeaders headers = new HttpHeaders();
            applyBrowserHeaders(headers, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, portalCookies, true);
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
            
            // log non-OK responses for debugging
            logger.warn("Activities request returned status {} with body: {}", response.getStatusCode().value(), response.getBody());
            return new ArrayList<>();
        } catch (Exception error) {
            logger.error("Error getting activities for {}: {}", numeroRadicacion, error.getMessage());
            // If initial attempt fails, try alternate URL without explicit :448 (some endpoints differ)
            logger.warn("Initial activities request failed for {}. Trying alternate host without :448.", numeroRadicacion);
                try {
                String altUrl = BASE_URL + "/api/v2/Proceso/Actuaciones";
                UriComponentsBuilder altBuilder = UriComponentsBuilder.fromHttpUrl(altUrl)
                    .queryParam("numero", numeroRadicacion.trim())
                    .queryParam("pagina", 1);

                HttpHeaders altHeaders = new HttpHeaders();
                applyBrowserHeaders(altHeaders, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, portalCookies, false);
                HttpEntity<String> altEntity = new HttpEntity<>(altHeaders);

                ResponseEntity<String> altResponse = restTemplate.exchange(
                    altBuilder.toUriString(),
                    HttpMethod.GET,
                    altEntity,
                    String.class
                );

                if (altResponse.getStatusCode() == HttpStatus.OK && altResponse.getBody() != null) {
                    JsonNode responseJson = objectMapper.readTree(altResponse.getBody());
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
                } else {
                    logger.warn("Alternate activities request returned status {} body: {}", altResponse.getStatusCode().value(), altResponse.getBody());
                }
            } catch (Exception ex) {
                logger.error("Alternate activities request failed for {}: {}", numeroRadicacion, ex.getMessage());
            }

            return new ArrayList<>();
        }
    }
    
    /**
     * Get process subjects/sujetos procesales
     */
    private List<ProcessSubject> getProcessSubjects(String numeroRadicacion) {
        String portalCookies = null;
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("lsNroRadicacion", numeroRadicacion.trim());
            portalCookies = fetchPortalCookies(numeroRadicacion);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            applyBrowserHeaders(headers, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, portalCookies, false);
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
            } else {
                logger.warn("Subjects request returned status {} with body: {}", response.getStatusCode().value(), response.getBody());
            }
            
            return new ArrayList<>();
        } catch (Exception error) {
            logger.error("Error getting subjects for {}: {}", numeroRadicacion, error.getMessage());
            // Try alternate host with :448 if initial POST fails
            try {
                String altUrl = "https://consultaprocesos.ramajudicial.gov.co:448/api/v1/Process/GetSujetosProcesales";
                HttpHeaders altHeaders = new HttpHeaders();
                altHeaders.setContentType(MediaType.APPLICATION_JSON);
                applyBrowserHeaders(altHeaders, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, portalCookies, true);

                Map<String, Object> altRequestBody = new HashMap<>();
                altRequestBody.put("lsNroRadicacion", numeroRadicacion.trim());
                if (portalCookies != null) {
                    altHeaders.set("Cookie", portalCookies);
                }
                HttpEntity<Map<String, Object>> altEntity = new HttpEntity<>(altRequestBody, altHeaders);

                ResponseEntity<String> altResponse = restTemplate.exchange(
                        altUrl,
                        HttpMethod.POST,
                        altEntity,
                        String.class
                );

                if (altResponse.getStatusCode() == HttpStatus.OK && altResponse.getBody() != null) {
                    JsonNode responseJson = objectMapper.readTree(altResponse.getBody());
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
            } catch (Exception ex) {
                logger.error("Alternate subjects request failed for {}: {}", numeroRadicacion, ex.getMessage());
            }

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
            String portalCookies = fetchPortalCookies(numeroRadicacion);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            applyBrowserHeaders(headers, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, portalCookies, false);
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
            
            // Timestamps - ALWAYS update these
            String now = LocalDateTime.now().toString();
            processRecord.put("updated_at", now);
            // Only set created_at if it's a new record (Supabase will handle this)
            
            JsonNode result = supabaseService.upsert("judicial_processes", processRecord, "numero_radicacion");
            
            String processId = null;
            
            // If upsert returns data, use it
            if (result != null && result.isArray() && result.size() > 0) {
                JsonNode firstResult = result.get(0);
                if (firstResult != null && firstResult.has("id")) {
                    processId = firstResult.get("id").asText();
                    logger.debug("Process ID from upsert result: {}", processId);
                }
            }
            
            // If no ID returned (update case), query by numero_radicacion
            if (processId == null) {
                logger.debug("No ID in upsert result, querying by numero_radicacion: {}", processData.getNumeroRadicacion());
                Map<String, Object> filters = new HashMap<>();
                filters.put("numero_radicacion", processData.getNumeroRadicacion());
                JsonNode queryResult = supabaseService.select("judicial_processes", filters);
                
                if (queryResult != null && queryResult.isArray() && queryResult.size() > 0) {
                    processId = queryResult.get(0).get("id").asText();
                    logger.debug("Process ID from query: {}", processId);
                } else {
                    logger.error("Error saving process data: Could not find process after upsert");
                    return null;
                }
            }
            
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
            
            logger.info("Successfully saved process data for: {} with ID: {}", processData.getNumeroRadicacion(), processId);
            return processId;
            
        } catch (Exception error) {
            logger.error("Error in saveProcessData: {}", error.getMessage(), error);
            return null;
        }
    }

    /**
     * Fetch raw activities JSON from the portal (returns parsed JsonNode or null)
     */
    public JsonNode fetchActivitiesRaw(String numeroRadicacion) {
        try {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(ACTIVITIES_API_URL)
                .queryParam("numero", numeroRadicacion.trim())
                .queryParam("pagina", 1);

            String cookies = fetchPortalCookies(numeroRadicacion);
            HttpHeaders headers = new HttpHeaders();
            applyBrowserHeaders(headers, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, cookies, true);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(uriBuilder.toUriString(), HttpMethod.GET, entity, String.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return objectMapper.readTree(response.getBody());
            }

            logger.warn("fetchActivitiesRaw: portal returned {} for {}", response.getStatusCode().value(), numeroRadicacion);
            return null;
        } catch (Exception e) {
            logger.error("fetchActivitiesRaw error for {}: {}", numeroRadicacion, e.getMessage());
            return null;
        }
    }

    /**
     * Fetch raw subjects JSON from the portal (returns parsed JsonNode or null)
     */
    public JsonNode fetchSubjectsRaw(String numeroRadicacion) {
        String cookies = fetchPortalCookies(numeroRadicacion);

        // Build JSON payload
        String payloadJson = null;
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("lsNroRadicacion", numeroRadicacion.trim());
            payloadJson = objectMapper.writeValueAsString(requestBody);
        } catch (Exception ex) {
            logger.debug("Failed to build JSON payload for subjects: {}", ex.getMessage());
        }

        // Try the known endpoints (without :448 and with :448)
        String[] urls = new String[] {
            API_BASE + "/v1/Process/GetSujetosProcesales",
            "https://consultaprocesos.ramajudicial.gov.co:448/api/v1/Process/GetSujetosProcesales"
        };

        for (String url : urls) {
            // Variant 1: POST application/json
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                applyBrowserHeaders(headers, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, cookies, url.contains(":448"));
                HttpEntity<String> entity = new HttpEntity<>(payloadJson, headers);

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    logger.debug("fetchSubjectsRaw: successful (POST JSON) from {}", url);
                    return objectMapper.readTree(response.getBody());
                }
                logger.warn("fetchSubjectsRaw (POST JSON) returned {} for {} (url={})", response.getStatusCode().value(), numeroRadicacion, url);
            } catch (Exception e) {
                logger.warn("fetchSubjectsRaw (POST JSON) failed for {} at {}: {}", numeroRadicacion, url, e.getMessage());
            }

            // Variant 2: POST application/x-www-form-urlencoded
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                applyBrowserHeaders(headers, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, cookies, url.contains(":448"));
                String formBody = "lsNroRadicacion=" + java.net.URLEncoder.encode(numeroRadicacion.trim(), "UTF-8");
                HttpEntity<String> entity = new HttpEntity<>(formBody, headers);

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    logger.debug("fetchSubjectsRaw: successful (POST form) from {}", url);
                    return objectMapper.readTree(response.getBody());
                }
                logger.warn("fetchSubjectsRaw (POST form) returned {} for {} (url={})", response.getStatusCode().value(), numeroRadicacion, url);
            } catch (Exception e) {
                logger.warn("fetchSubjectsRaw (POST form) failed for {} at {}: {}", numeroRadicacion, url, e.getMessage());
            }

            // Variant 3: GET with query param
            try {
                UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("lsNroRadicacion", numeroRadicacion.trim());
                HttpHeaders headers = new HttpHeaders();
                applyBrowserHeaders(headers, BASE_URL + "/Procesos/NumeroRadicacion?numeroRadicacion=" + numeroRadicacion, cookies, url.contains(":448"));
                HttpEntity<String> entity = new HttpEntity<>(headers);

                ResponseEntity<String> response = restTemplate.exchange(builder.toUriString(), HttpMethod.GET, entity, String.class);
                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    logger.debug("fetchSubjectsRaw: successful (GET) from {}", url);
                    return objectMapper.readTree(response.getBody());
                }
                logger.warn("fetchSubjectsRaw (GET) returned {} for {} (url={})", response.getStatusCode().value(), numeroRadicacion, url);
            } catch (Exception e) {
                logger.warn("fetchSubjectsRaw (GET) failed for {} at {}: {}", numeroRadicacion, url, e.getMessage());
            }
        }

        logger.error("fetchSubjectsRaw error for {}: all request variants failed (received 405/other).", numeroRadicacion);
        return null;
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