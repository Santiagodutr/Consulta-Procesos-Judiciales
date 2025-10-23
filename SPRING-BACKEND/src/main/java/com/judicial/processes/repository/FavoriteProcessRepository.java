package com.judicial.processes.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.judicial.processes.config.SupabaseProperties;
import com.judicial.processes.entity.FavoriteProcess;

@Repository
public class FavoriteProcessRepository {
    
    private static final Logger logger = LoggerFactory.getLogger(FavoriteProcessRepository.class);
    private static final String TABLE_NAME = "favorite_processes";
    
    @Autowired
    private SupabaseProperties supabaseProperties;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseProperties.getServiceRoleKey());
        headers.set("Authorization", "Bearer " + supabaseProperties.getServiceRoleKey());
        headers.set("Prefer", "return=representation");
        return headers;
    }
    
    public FavoriteProcess save(FavoriteProcess favoriteProcess) {
        try {
            String url = supabaseProperties.getRestUrl() + "/" + TABLE_NAME;
            
            HttpHeaders headers = createHeaders();
            HttpEntity<FavoriteProcess> request = new HttpEntity<>(favoriteProcess, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                if (jsonNode.isArray() && jsonNode.size() > 0) {
                    return objectMapper.treeToValue(jsonNode.get(0), FavoriteProcess.class);
                }
            }
            
            return favoriteProcess;
        } catch (Exception e) {
            logger.error("Error saving favorite process", e);
            throw new RuntimeException("Error saving favorite process", e);
        }
    }
    
    public List<FavoriteProcess> findByUserId(String userId) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl(supabaseProperties.getRestUrl() + "/" + TABLE_NAME)
                .queryParam("user_id", "eq." + userId)
                .queryParam("select", "*")
                .queryParam("order", "created_at.desc")
                .build()
                .toUriString();
            
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                List<FavoriteProcess> favorites = new ArrayList<>();
                
                if (jsonNode.isArray()) {
                    for (JsonNode node : jsonNode) {
                        FavoriteProcess favorite = objectMapper.treeToValue(node, FavoriteProcess.class);
                        favorites.add(favorite);
                    }
                }
                
                return favorites;
            }
            
            return new ArrayList<>();
        } catch (Exception e) {
            logger.error("Error finding favorites by user ID", e);
            throw new RuntimeException("Error finding favorites", e);
        }
    }
    
    public Optional<FavoriteProcess> findByUserIdAndNumeroRadicacion(String userId, String numeroRadicacion) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl(supabaseProperties.getRestUrl() + "/" + TABLE_NAME)
                .queryParam("user_id", "eq." + userId)
                .queryParam("numero_radicacion", "eq." + numeroRadicacion)
                .queryParam("select", "*")
                .build()
                .toUriString();
            
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                
                if (jsonNode.isArray() && jsonNode.size() > 0) {
                    FavoriteProcess favorite = objectMapper.treeToValue(jsonNode.get(0), FavoriteProcess.class);
                    return Optional.of(favorite);
                }
            }
            
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Error finding favorite by user ID and numero radicacion", e);
            return Optional.empty();
        }
    }
    
    public void deleteByUserIdAndNumeroRadicacion(String userId, String numeroRadicacion) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl(supabaseProperties.getRestUrl() + "/" + TABLE_NAME)
                .queryParam("user_id", "eq." + userId)
                .queryParam("numero_radicacion", "eq." + numeroRadicacion)
                .build()
                .toUriString();
            
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            restTemplate.exchange(url, HttpMethod.DELETE, request, String.class);
            
        } catch (Exception e) {
            logger.error("Error deleting favorite process", e);
            throw new RuntimeException("Error deleting favorite process", e);
        }
    }
}
