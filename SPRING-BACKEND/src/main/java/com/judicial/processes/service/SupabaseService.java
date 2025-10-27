package com.judicial.processes.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.judicial.processes.config.SupabaseProperties;

@Service
public class SupabaseService {
    
    private static final Logger logger = LoggerFactory.getLogger(SupabaseService.class);
    
    @Autowired
    private SupabaseProperties supabaseProperties;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * Create HTTP headers for Supabase requests
     */
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseProperties.getServiceRoleKey());
        headers.set("Authorization", "Bearer " + supabaseProperties.getServiceRoleKey());
        return headers;
    }
    
    /**
     * Create HTTP headers with user JWT token for auth operations
     */
    private HttpHeaders createAuthHeaders(String userToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String anonKey = supabaseProperties.getAnonKey();
        String apiKeyToUse = (anonKey != null && !anonKey.isBlank()) ? anonKey : supabaseProperties.getServiceRoleKey();
        headers.set("apikey", apiKeyToUse);
        headers.set("Authorization", "Bearer " + userToken);
        return headers;
    }
    
    // AUTH METHODS
    
    /**
     * Sign up a new user with Supabase Auth
     */
    public JsonNode signUp(String email, String password, Map<String, Object> metadata) {
        try {
            String url = supabaseProperties.getAuthUrl() + "/signup";
            
            Map<String, Object> requestBody = Map.of(
                "email", email,
                "password", password,
                "data", metadata != null ? metadata : Map.of()
            );
            
            HttpHeaders headers = createHeaders();
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return objectMapper.readTree(response.getBody());
            } else {
                logger.error("Supabase signup failed with status: {}", response.getStatusCode());
                throw new RuntimeException("Signup failed");
            }
            
        } catch (Exception e) {
            logger.error("Supabase signup error", e);
            throw new RuntimeException("Signup failed", e);
        }
    }
    
    /**
     * Sign in user with Supabase Auth
     */
    public JsonNode signIn(String email, String password) {
        try {
            // Use the correct Supabase Auth REST API endpoint for password login
            String url = supabaseProperties.getAuthUrl() + "/token?grant_type=password";
            logger.info("Attempting login to URL: {}", url);
            
            Map<String, String> requestBody = Map.of(
                "email", email,
                "password", password
            );
            logger.info("Login request body: {}", requestBody);
            
            // Use anon key for authentication requests (not service role key)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("apikey", supabaseProperties.getAnonKey());
            headers.set("Authorization", "Bearer " + supabaseProperties.getAnonKey());
            logger.info("Using anon key: {}", supabaseProperties.getAnonKey() != null ? "YES" : "NO");
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            logger.info("Supabase login response status: {}", response.getStatusCode());
            logger.info("Supabase login response body: {}", response.getBody());
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return objectMapper.readTree(response.getBody());
            } else {
                logger.error("Supabase signin failed with status: {} - Response: {}", 
                    response.getStatusCode(), response.getBody());
                return null;
            }
            
        } catch (Exception e) {
            logger.error("Supabase signin error", e);
            return null;
        }
    }
    
    /**
     * Get user information using JWT token
     */
    public JsonNode getUser(String jwt) {
        try {
            String url = supabaseProperties.getAuthUrl() + "/user";
            
            HttpHeaders headers = createAuthHeaders(jwt);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return objectMapper.readTree(response.getBody());
            } else {
                return null;
            }
            
        } catch (Exception e) {
            logger.error("Supabase get user error", e);
            return null;
        }
    }

    /**
     * Retrieve a user profile by id using service role key.
     */
    public JsonNode getAuthUserById(String userId) {
        try {
            String url = supabaseProperties.getAuthUrl() + "/admin/users/" + userId;

            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return objectMapper.readTree(response.getBody());
            }

            logger.error("Supabase admin user fetch failed with status: {}", response.getStatusCode());
            return null;
        } catch (Exception e) {
            logger.error("Supabase getAuthUserById error", e);
            return null;
        }
    }
    
    /**
     * Sign out user
     */
    public boolean signOut(String jwt) {
        try {
            String url = supabaseProperties.getAuthUrl() + "/logout";
            
            HttpHeaders headers = createAuthHeaders(jwt);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            return response.getStatusCode().is2xxSuccessful();
            
        } catch (Exception e) {
            logger.error("Supabase signout error", e);
            return false;
        }
    }
    
    /**
     * Refresh user session
     */
    public JsonNode refreshSession(String refreshToken) {
        try {
            String url = supabaseProperties.getAuthUrl() + "/token?grant_type=refresh_token";
            
            Map<String, String> requestBody = Map.of(
                "refresh_token", refreshToken
            );
            
            HttpHeaders headers = createHeaders();
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return objectMapper.readTree(response.getBody());
            } else {
                return null;
            }
            
        } catch (Exception e) {
            logger.error("Supabase refresh session error", e);
            return null;
        }
    }
    
    // DATABASE METHODS
    
    /**
     * Insert data into Supabase table
     */
    public JsonNode insert(String table, Map<String, Object> data) {
        try {
            String url = supabaseProperties.getRestUrl() + "/" + table;
            
            logger.debug("Inserting into table {}: {}", table, data);
            
            HttpHeaders headers = createHeaders();
            headers.set("Prefer", "return=representation");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode result = objectMapper.readTree(response.getBody());
                logger.debug("Insert successful for table {}, result: {}", table, result);
                if (result.isArray() && result.size() > 0) {
                    return result.get(0);
                }
                return result;
            } else {
                logger.error("Supabase insert failed for table {}: {} - Response: {}", 
                    table, response.getStatusCode(), response.getBody());
                throw new RuntimeException("Insert failed with status: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("Supabase insert error in table {} with data {}: {}", 
                table, data, e.getMessage(), e);
            throw new RuntimeException("Insert failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Select data from Supabase table with optional filters
     */
    public JsonNode select(String table, Map<String, Object> filters) {
        try {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(supabaseProperties.getRestUrl() + "/" + table)
                .queryParam("select", "*");
            
            // Add filters as query parameters
            if (filters != null) {
                filters.forEach((key, value) -> {
                    uriBuilder.queryParam(key, "eq." + value);
                });
            }
            
            String url = uriBuilder.toUriString();
            
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return objectMapper.readTree(response.getBody());
            } else {
                logger.error("Supabase select failed for table {}: {}", table, response.getStatusCode());
                return objectMapper.createArrayNode();
            }
            
        } catch (Exception e) {
            logger.error("Supabase select error in table " + table, e);
            return objectMapper.createArrayNode();
        }
    }
    
    /**
     * Select data from Supabase table with limit and ordering
     */
    public JsonNode selectWithLimit(String table, Map<String, Object> filters, int limit, String orderBy, String order) {
        try {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(supabaseProperties.getRestUrl() + "/" + table)
                .queryParam("select", "*")
                .queryParam("limit", limit);
            
            // Add ordering
            if (orderBy != null && !orderBy.isEmpty()) {
                String orderParam = orderBy + "." + (order != null && order.equalsIgnoreCase("desc") ? "desc" : "asc");
                uriBuilder.queryParam("order", orderParam);
            }
            
            // Add filters as query parameters
            if (filters != null) {
                filters.forEach((key, value) -> {
                    uriBuilder.queryParam(key, "eq." + value);
                });
            }
            
            String url = uriBuilder.toUriString();
            
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return objectMapper.readTree(response.getBody());
            } else {
                logger.error("Supabase selectWithLimit failed for table {}: {}", table, response.getStatusCode());
                return objectMapper.createArrayNode();
            }
            
        } catch (Exception e) {
            logger.error("Supabase selectWithLimit error in table " + table, e);
            return objectMapper.createArrayNode();
        }
    }
    
    /**
     * Update data in Supabase table
     */
    public JsonNode update(String table, String id, Map<String, Object> data) {
        try {
            String url = supabaseProperties.getRestUrl() + "/" + table + "?id=eq." + id;
            
            HttpHeaders headers = createHeaders();
            headers.set("Prefer", "return=representation");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PATCH, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode result = objectMapper.readTree(response.getBody());
                if (result.isArray() && result.size() > 0) {
                    return result.get(0);
                }
                return result;
            } else {
                logger.error("Supabase update failed for table {}: {}", table, response.getStatusCode());
                throw new RuntimeException("Update failed");
            }
            
        } catch (Exception e) {
            logger.error("Supabase update error in table " + table, e);
            throw new RuntimeException("Update failed", e);
        }
    }
    
    /**
     * Delete data from Supabase table
     */
    public boolean delete(String table, String id) {
        try {
            String url = supabaseProperties.getRestUrl() + "/" + table + "?id=eq." + id;
            
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.DELETE, request, String.class);
            
            return response.getStatusCode().is2xxSuccessful();
            
        } catch (Exception e) {
            logger.error("Supabase delete error in table " + table, e);
            return false;
        }
    }
    
    /**
     * Delete data from Supabase table with conditions
     */
    public boolean deleteWhere(String table, Map<String, Object> conditions) {
        try {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(supabaseProperties.getRestUrl() + "/" + table);
            
            // Add conditions as query parameters
            conditions.forEach((key, value) -> {
                uriBuilder.queryParam(key, "eq." + value);
            });
            
            String url = uriBuilder.toUriString();
            
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.DELETE, request, String.class);
            
            return response.getStatusCode().is2xxSuccessful();
            
        } catch (Exception e) {
            logger.error("Supabase deleteWhere error in table " + table, e);
            return false;
        }
    }
    
    /**
     * Upsert (insert or update) data in Supabase table
     */
    public JsonNode upsert(String table, Map<String, Object> data, String conflictColumn) {
        try {
            String url = supabaseProperties.getRestUrl() + "/" + table;
            
            HttpHeaders headers = createHeaders();
            // Use proper Supabase upsert header with on-conflict parameter
            if (conflictColumn != null) {
                headers.set("Prefer", "return=representation,resolution=merge-duplicates");
                url += "?on_conflict=" + conflictColumn;
            } else {
                headers.set("Prefer", "return=representation");
            }
            
            logger.debug("Upserting to table {} with conflict column: {}", table, conflictColumn);
            logger.debug("Upsert data: {}", data);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                String responseBody = response.getBody();
                logger.debug("Upsert response body: {}", responseBody);
                
                JsonNode result = objectMapper.readTree(responseBody);
                logger.debug("Upsert successful for table {}. Result is array: {}, size: {}", 
                    table, result.isArray(), result.isArray() ? result.size() : "N/A");
                
                return result;
            } else {
                logger.error("Supabase upsert failed for table {}: {} - Response: {}", 
                    table, response.getStatusCode(), response.getBody());
                throw new RuntimeException("Upsert failed with status: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("Supabase upsert error in table {} with data {}: {}", 
                table, data, e.getMessage(), e);
            throw new RuntimeException("Upsert failed: " + e.getMessage(), e);
        }
    }
}