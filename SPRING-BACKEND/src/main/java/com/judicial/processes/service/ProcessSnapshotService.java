package com.judicial.processes.service;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.judicial.processes.entity.ProcessSnapshot;

@Service
public class ProcessSnapshotService {

    private static final Logger logger = LoggerFactory.getLogger(ProcessSnapshotService.class);
    private static final String TABLE_NAME = "process_snapshots";

    @Autowired
    private SupabaseService supabaseService;

    public ProcessSnapshot getSnapshot(String processNumber) {
        try {
            JsonNode result = supabaseService.select(TABLE_NAME, Map.of("process_number", processNumber));
            if (result.isArray() && result.size() > 0) {
                JsonNode node = result.get(0);
                ProcessSnapshot snapshot = new ProcessSnapshot();
                snapshot.setProcessId(node.has("process_id") && !node.get("process_id").isNull() ? node.get("process_id").asText() : null);
                snapshot.setProcessNumber(node.has("process_number") ? node.get("process_number").asText() : processNumber);
                snapshot.setLastActivityDate(node.has("last_activity_date") && !node.get("last_activity_date").isNull() ? node.get("last_activity_date").asText() : null);
                snapshot.setLastDecisionDate(node.has("last_decision_date") && !node.get("last_decision_date").isNull() ? node.get("last_decision_date").asText() : null);
                snapshot.setLastStatus(node.has("last_status") && !node.get("last_status").isNull() ? node.get("last_status").asText() : null);
                snapshot.setSummary(node.has("summary") && !node.get("summary").isNull() ? node.get("summary").asText() : null);
                return snapshot;
            }
            return null;
        } catch (Exception e) {
            logger.error("Error fetching snapshot for process {}", processNumber, e);
            throw new RuntimeException("Failed to fetch process snapshot", e);
        }
    }

    public void upsertSnapshot(ProcessSnapshot snapshot) {
        try {
            Map<String, Object> data = new HashMap<>();
            data.put("process_id", snapshot.getProcessId());
            data.put("process_number", snapshot.getProcessNumber());
            data.put("last_activity_date", snapshot.getLastActivityDate());
            data.put("last_decision_date", snapshot.getLastDecisionDate());
            data.put("last_status", snapshot.getLastStatus());
            data.put("summary", snapshot.getSummary());

            supabaseService.upsert(TABLE_NAME, data, "process_number");
        } catch (Exception e) {
            logger.error("Error upserting snapshot for process {}", snapshot.getProcessNumber(), e);
            throw new RuntimeException("Failed to persist process snapshot", e);
        }
    }
}
