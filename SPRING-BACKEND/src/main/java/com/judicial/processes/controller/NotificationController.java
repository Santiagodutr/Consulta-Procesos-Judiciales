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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.judicial.processes.entity.NotificationRecord;
import com.judicial.processes.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"http://localhost:3000", "https://localhost:3000"})
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("message", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String userId = authentication.getName();
            List<NotificationRecord> notifications = notificationService.getNotifications(userId, limit, offset);

            response.put("success", true);
            response.put("data", notifications);
            response.put("count", notifications.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching notifications", e);
            response.put("success", false);
            response.put("message", "Error al obtener las notificaciones");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<Map<String, Object>> getUnreadNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "10") int limit) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("message", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String userId = authentication.getName();
            List<NotificationRecord> notifications = notificationService.getUnreadNotifications(userId, limit);

            response.put("success", true);
            response.put("data", notifications);
            response.put("count", notifications.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching unread notifications", e);
            response.put("success", false);
            response.put("message", "Error al obtener las notificaciones");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
        @PathVariable String notificationId,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("message", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            notificationService.markAsRead(notificationId);
            response.put("success", true);
            response.put("message", "Notificación marcada como leída");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error marking notification as read", e);
            response.put("success", false);
            response.put("message", "Error al actualizar la notificación");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("message", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String userId = authentication.getName();
            notificationService.markAllAsRead(userId);
            response.put("success", true);
            response.put("message", "Notificaciones marcadas como leídas");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error marking notifications as read", e);
            response.put("success", false);
            response.put("message", "Error al actualizar las notificaciones");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
