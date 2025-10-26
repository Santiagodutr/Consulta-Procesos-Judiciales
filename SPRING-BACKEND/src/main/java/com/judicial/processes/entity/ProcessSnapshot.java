package com.judicial.processes.entity;

public class ProcessSnapshot {
    private String processId;
    private String processNumber;
    private String lastActivityDate;
    private String lastDecisionDate;
    private String lastStatus;
    private String summary;

    public ProcessSnapshot() {
    }

    public ProcessSnapshot(String processId, String processNumber, String lastActivityDate,
                           String lastDecisionDate, String lastStatus, String summary) {
        this.processId = processId;
        this.processNumber = processNumber;
        this.lastActivityDate = lastActivityDate;
        this.lastDecisionDate = lastDecisionDate;
        this.lastStatus = lastStatus;
        this.summary = summary;
    }

    public String getProcessId() {
        return processId;
    }

    public void setProcessId(String processId) {
        this.processId = processId;
    }

    public String getProcessNumber() {
        return processNumber;
    }

    public void setProcessNumber(String processNumber) {
        this.processNumber = processNumber;
    }

    public String getLastActivityDate() {
        return lastActivityDate;
    }

    public void setLastActivityDate(String lastActivityDate) {
        this.lastActivityDate = lastActivityDate;
    }

    public String getLastDecisionDate() {
        return lastDecisionDate;
    }

    public void setLastDecisionDate(String lastDecisionDate) {
        this.lastDecisionDate = lastDecisionDate;
    }

    public String getLastStatus() {
        return lastStatus;
    }

    public void setLastStatus(String lastStatus) {
        this.lastStatus = lastStatus;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}
