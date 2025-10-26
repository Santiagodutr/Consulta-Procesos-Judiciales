package com.judicial.processes.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.judicial.processes.dto.ProcessActivity;
import com.judicial.processes.dto.ProcessData;
import com.judicial.processes.entity.FavoriteProcess;
import com.judicial.processes.entity.NotificationRecord;
import com.judicial.processes.entity.ProcessSnapshot;
import com.judicial.processes.repository.FavoriteProcessRepository;

@Service
public class ProcessMonitoringService {

    private static final Logger logger = LoggerFactory.getLogger(ProcessMonitoringService.class);

    private static final String DEFAULT_NOTIFICATION_TITLE = "Actualización en proceso";

    @Autowired
    private FavoriteProcessRepository favoriteProcessRepository;

    @Autowired
    private JudicialScrapingService judicialScrapingService;

    @Autowired
    private ProcessSnapshotService processSnapshotService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SupabaseService supabaseService;

    @Value("${monitoring.enabled:true}")
    private boolean monitoringEnabled;

    private final Map<String, String> userEmailCache = new HashMap<>();

    @Scheduled(fixedDelayString = "${monitoring.interval.millis:600000}", initialDelayString = "${monitoring.initial-delay.millis:60000}")
    public void monitorFavoriteProcesses() {
        if (!monitoringEnabled) {
            logger.debug("Process monitoring disabled by configuration");
            return;
        }

        logger.info("Starting favorite processes monitoring cycle");

        List<FavoriteProcess> favorites = favoriteProcessRepository.findAll();
        if (favorites.isEmpty()) {
            logger.debug("No favorite processes registered");
            return;
        }

        Map<String, ProcessData> processCache = new HashMap<>();

        for (FavoriteProcess favorite : favorites) {
            String processNumber = favorite.getNumeroRadicacion();
            if (processNumber == null || processNumber.isBlank()) {
                continue;
            }

            ProcessData currentData = processCache.computeIfAbsent(processNumber, this::fetchLatestProcessData);
            if (currentData == null) {
                logger.debug("No data retrieved for process {}", processNumber);
                continue;
            }

            ProcessSnapshot previousSnapshot = processSnapshotService.getSnapshot(processNumber);
            ProcessSnapshot newSnapshot = buildSnapshot(currentData);

            Optional<String> changeDescription = describeChange(previousSnapshot, newSnapshot, currentData);
            if (changeDescription.isEmpty()) {
                continue;
            }

            processSnapshotService.upsertSnapshot(newSnapshot);

            String message = changeDescription.get();
            createNotification(favorite, message);
            sendEmailIfPossible(favorite, message, processNumber);
        }

        logger.info("Finished favorite processes monitoring cycle");
    }

    private ProcessData fetchLatestProcessData(String processNumber) {
        try {
            return judicialScrapingService.scrapeProcessData(processNumber, false);
        } catch (Exception e) {
            logger.error("Unable to fetch data for process {}", processNumber, e);
            return null;
        }
    }

    private ProcessSnapshot buildSnapshot(ProcessData processData) {
        ProcessSnapshot snapshot = new ProcessSnapshot();
        snapshot.setProcessId(processData.getIdProceso() != null ? processData.getIdProceso().toString() : null);
        snapshot.setProcessNumber(processData.getNumeroRadicacion());
        snapshot.setLastActivityDate(processData.getFechaUltimaActuacion());
        snapshot.setLastDecisionDate(processData.getFechaProceso());
        snapshot.setLastStatus(processData.getEstado());

        ProcessActivity latestActivity = extractLatestActivity(processData);
        if (latestActivity != null) {
            StringBuilder summaryBuilder = new StringBuilder();
            if (latestActivity.getActuacion() != null) {
                summaryBuilder.append(latestActivity.getActuacion());
            }
            if (latestActivity.getAnotacion() != null && !latestActivity.getAnotacion().isBlank()) {
                if (summaryBuilder.length() > 0) {
                    summaryBuilder.append(" - ");
                }
                summaryBuilder.append(latestActivity.getAnotacion());
            }
            snapshot.setSummary(summaryBuilder.length() > 0 ? summaryBuilder.toString() : null);
        }

        return snapshot;
    }

    private ProcessActivity extractLatestActivity(ProcessData processData) {
        if (processData.getActuaciones() == null || processData.getActuaciones().isEmpty()) {
            return null;
        }
        return processData.getActuaciones().get(0);
    }

    private Optional<String> describeChange(ProcessSnapshot previous, ProcessSnapshot current, ProcessData processData) {
        if (current.getLastActivityDate() == null && current.getLastStatus() == null) {
            return Optional.empty();
        }

        if (previous == null) {
            return Optional.of(buildInitialNotificationMessage(current, processData));
        }

        boolean activityChanged = hasChanged(previous.getLastActivityDate(), current.getLastActivityDate());
        boolean statusChanged = hasChanged(previous.getLastStatus(), current.getLastStatus());
        boolean summaryChanged = hasChanged(previous.getSummary(), current.getSummary());

        if (!activityChanged && !statusChanged && !summaryChanged) {
            return Optional.empty();
        }

        StringBuilder message = new StringBuilder();
        message.append("Proceso ")
            .append(processData.getNumeroRadicacion() != null ? processData.getNumeroRadicacion() : "sin radicación")
            .append(": se detectaron cambios.");

        if (activityChanged) {
            message.append(" Última actuación: ")
                .append(current.getLastActivityDate() != null ? current.getLastActivityDate() : "sin registrar");
        }

        if (statusChanged) {
            message.append(" Estado actualizado: ")
                .append(current.getLastStatus() != null ? current.getLastStatus() : "sin estado");
        }

        if (summaryChanged && current.getSummary() != null) {
            message.append(" Detalle: ").append(current.getSummary());
        }

        return Optional.of(message.toString());
    }

    private boolean hasChanged(String previous, String current) {
        if (previous == null && current == null) {
            return false;
        }
        if (previous == null) {
            return true;
        }
        return !previous.equals(current);
    }

    private String buildInitialNotificationMessage(ProcessSnapshot current, ProcessData processData) {
        StringBuilder message = new StringBuilder();
        message.append("Proceso ")
            .append(processData.getNumeroRadicacion() != null ? processData.getNumeroRadicacion() : "sin radicación")
            .append(": seguimiento iniciado.");
        if (current.getLastActivityDate() != null) {
            message.append(" Última actuación registrada el ").append(current.getLastActivityDate()).append('.');
        }
        if (current.getSummary() != null) {
            message.append(' ').append(current.getSummary());
        }
        return message.toString();
    }

    private void createNotification(FavoriteProcess favorite, String message) {
        NotificationRecord notification = new NotificationRecord(
            favorite.getUserId(),
            null,
            DEFAULT_NOTIFICATION_TITLE + " " + favorite.getNumeroRadicacion(),
            message
        );
        notification.setType("in_app");
        notificationService.createNotification(notification);
    }

    private void sendEmailIfPossible(FavoriteProcess favorite, String message, String processNumber) {
        String email = resolveUserEmail(favorite.getUserId());
        if (email == null || email.isBlank()) {
            logger.debug("No email found for user {} to send process update", favorite.getUserId());
            return;
        }

        try {
            emailService.sendProcessUpdateNotification(email, processNumber, message);
        } catch (Exception e) {
            logger.error("Failed to send process update email to {}", email, e);
        }
    }

    private String resolveUserEmail(String userId) {
        if (userEmailCache.containsKey(userId)) {
            return userEmailCache.get(userId);
        }

        try {
            JsonNode userNode = supabaseService.getAuthUserById(userId);
            if (userNode != null && userNode.has("email")) {
                String email = userNode.get("email").asText();
                userEmailCache.put(userId, email);
                return email;
            }
        } catch (Exception e) {
            logger.error("Error resolving email for user {}", userId, e);
        }

        userEmailCache.put(userId, null);
        return null;
    }
}
