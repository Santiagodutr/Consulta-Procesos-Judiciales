package com.judicial.processes.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
import com.judicial.processes.entity.NotificationRecord;

@Repository
public class NotificationRepository {

    private static final Logger logger = LoggerFactory.getLogger(NotificationRepository.class);
    private static final String TABLE_NAME = "notifications";

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

    public NotificationRecord save(NotificationRecord notification) {
        try {
            String url = supabaseProperties.getRestUrl() + "/" + TABLE_NAME;

            if (notification.getType() == null) {
                notification.setType("in_app");
            }

            HttpHeaders headers = createHeaders();
            HttpEntity<NotificationRecord> request = new HttpEntity<>(notification, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                if (jsonNode.isArray() && jsonNode.size() > 0) {
                    return objectMapper.treeToValue(jsonNode.get(0), NotificationRecord.class);
                }
            }

            return notification;
        } catch (Exception e) {
            logger.error("Error saving notification", e);
            throw new RuntimeException("Error saving notification", e);
        }
    }

    public List<NotificationRecord> findUnreadByUser(String userId, int limit) {
        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(supabaseProperties.getRestUrl() + "/" + TABLE_NAME)
                .queryParam("user_id", "eq." + userId)
                .queryParam("is_read", "eq.false")
                .queryParam("select", "*")
                .queryParam("order", "created_at.desc");

            if (limit > 0) {
                builder.queryParam("limit", limit);
            }

            String url = builder.build().toUriString();

            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                List<NotificationRecord> notifications = new ArrayList<>();

                if (jsonNode.isArray()) {
                    for (JsonNode node : jsonNode) {
                        notifications.add(objectMapper.treeToValue(node, NotificationRecord.class));
                    }
                }

                return notifications;
            }

            return new ArrayList<>();
        } catch (Exception e) {
            logger.error("Error fetching unread notifications", e);
            throw new RuntimeException("Error fetching notifications", e);
        }
    }

    public List<NotificationRecord> findByUser(String userId, int limit, int offset) {
        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(supabaseProperties.getRestUrl() + "/" + TABLE_NAME)
                .queryParam("user_id", "eq." + userId)
                .queryParam("select", "*")
                .queryParam("order", "created_at.desc");

            if (limit > 0) {
                builder.queryParam("limit", limit);
            }

            if (offset > 0) {
                builder.queryParam("offset", offset);
            }

            String url = builder.build().toUriString();

            HttpHeaders headers = createHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                List<NotificationRecord> notifications = new ArrayList<>();

                if (jsonNode.isArray()) {
                    for (JsonNode node : jsonNode) {
                        notifications.add(objectMapper.treeToValue(node, NotificationRecord.class));
                    }
                }

                return notifications;
            }

            return new ArrayList<>();
        } catch (Exception e) {
            logger.error("Error fetching notifications", e);
            throw new RuntimeException("Error fetching notifications", e);
        }
    }

    public void markAsRead(String notificationId) {
        try {
            String url = supabaseProperties.getRestUrl() + "/" + TABLE_NAME + "?id=eq." + notificationId;

            HttpHeaders headers = createHeaders();
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(
                Map.of(
                    "is_read", true,
                    "read_at", java.time.OffsetDateTime.now().toString()
                ),
                headers
            );

            restTemplate.exchange(url, HttpMethod.PATCH, request, String.class);
        } catch (Exception e) {
            logger.error("Error marking notification as read", e);
            throw new RuntimeException("Error updating notification", e);
        }
    }

    public void markAllAsRead(String userId) {
        try {
            String url = UriComponentsBuilder
                .fromHttpUrl(supabaseProperties.getRestUrl() + "/" + TABLE_NAME)
                .queryParam("user_id", "eq." + userId)
                .build()
                .toUriString();

            HttpHeaders headers = createHeaders();
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(
                Map.of(
                    "is_read", true,
                    "read_at", java.time.OffsetDateTime.now().toString()
                ),
                headers
            );

            restTemplate.exchange(url, HttpMethod.PATCH, request, String.class);
        } catch (Exception e) {
            logger.error("Error marking notifications as read", e);
            throw new RuntimeException("Error updating notifications", e);
        }
    }
}
