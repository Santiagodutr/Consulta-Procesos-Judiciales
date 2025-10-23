package com.judicial.processes.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.judicial.processes.entity.FavoriteProcess;
import com.judicial.processes.repository.FavoriteProcessRepository;

@RestController
@RequestMapping("/api/judicial/processes/favorites")
@CrossOrigin(origins = {"http://localhost:3000", "https://localhost:3000"})
public class FavoriteProcessController {
    
    private static final Logger logger = LoggerFactory.getLogger(FavoriteProcessController.class);
    
    @Autowired
    private FavoriteProcessRepository favoriteProcessRepository;
    
    /**
     * Save a process as favorite
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> saveFavorite(
            @RequestBody Map<String, String> requestBody,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("message", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            String userId = authentication.getName();
            String numeroRadicacion = requestBody.get("numero_radicacion");
            
            logger.info("Attempting to save favorite for user: {} with radicacion: {}", userId, numeroRadicacion);
            
            if (numeroRadicacion == null || numeroRadicacion.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Número de radicación requerido");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if already exists
            var existing = favoriteProcessRepository.findByUserIdAndNumeroRadicacion(userId, numeroRadicacion);
            if (existing.isPresent()) {
                response.put("success", true);
                response.put("message", "El proceso ya está en favoritos");
                response.put("data", existing.get());
                return ResponseEntity.ok(response);
            }
            
            // Create new favorite
            FavoriteProcess favoriteProcess = new FavoriteProcess(
                userId,
                numeroRadicacion,
                requestBody.getOrDefault("despacho", ""),
                requestBody.getOrDefault("demandante", ""),
                requestBody.getOrDefault("demandado", ""),
                requestBody.getOrDefault("tipo_proceso", ""),
                requestBody.getOrDefault("fecha_radicacion", "")
            );
            
            logger.info("Saving favorite process: {}", favoriteProcess);
            FavoriteProcess saved = favoriteProcessRepository.save(favoriteProcess);
            logger.info("Successfully saved favorite process with id: {}", saved.getId());
            
            response.put("success", true);
            response.put("message", "Proceso agregado a favoritos");
            response.put("data", saved);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error saving favorite process", e);
            response.put("success", false);
            response.put("message", "Error al guardar el proceso: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Get all favorite processes for current user
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getFavorites(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("message", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            String userId = authentication.getName();
            List<FavoriteProcess> favorites = favoriteProcessRepository.findByUserId(userId);
            
            response.put("success", true);
            response.put("data", favorites);
            response.put("count", favorites.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching favorites", e);
            response.put("success", false);
            response.put("message", "Error al obtener favoritos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Check if a process is favorite
     */
    @GetMapping("/check/{numeroRadicacion}")
    public ResponseEntity<Map<String, Object>> checkIfFavorite(
            @PathVariable String numeroRadicacion,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("message", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            String userId = authentication.getName();
            var favorite = favoriteProcessRepository.findByUserIdAndNumeroRadicacion(userId, numeroRadicacion);
            
            Map<String, Object> data = new HashMap<>();
            data.put("isFavorite", favorite.isPresent());
            
            response.put("success", true);
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error checking favorite", e);
            response.put("success", false);
            response.put("message", "Error al verificar favorito: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Remove a process from favorites
     */
    @DeleteMapping("/{numeroRadicacion}")
    public ResponseEntity<Map<String, Object>> removeFavorite(
            @PathVariable String numeroRadicacion,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("message", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            String userId = authentication.getName();
            
            // Check if exists
            var existing = favoriteProcessRepository.findByUserIdAndNumeroRadicacion(userId, numeroRadicacion);
            if (existing.isEmpty()) {
                response.put("success", false);
                response.put("message", "El proceso no está en favoritos");
                return ResponseEntity.notFound().build();
            }
            
            favoriteProcessRepository.deleteByUserIdAndNumeroRadicacion(userId, numeroRadicacion);
            
            response.put("success", true);
            response.put("message", "Proceso removido de favoritos");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error removing favorite", e);
            response.put("success", false);
            response.put("message", "Error al remover favorito: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
