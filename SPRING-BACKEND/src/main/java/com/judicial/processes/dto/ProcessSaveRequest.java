package com.judicial.processes.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

public class ProcessSaveRequest {
    
    @NotBlank(message = "El número de radicación es requerido")
    private String numeroRadicacion;
    
    private Boolean soloActivos;
    
    private Map<String, Object> processData;
    
    // Constructors
    public ProcessSaveRequest() {}
    
    public ProcessSaveRequest(String numeroRadicacion, Boolean soloActivos, Map<String, Object> processData) {
        this.numeroRadicacion = numeroRadicacion;
        this.soloActivos = soloActivos;
        this.processData = processData;
    }
    
    // Getters and Setters
    public String getNumeroRadicacion() {
        return numeroRadicacion;
    }
    
    public void setNumeroRadicacion(String numeroRadicacion) {
        this.numeroRadicacion = numeroRadicacion;
    }
    
    public Boolean getSoloActivos() {
        return soloActivos;
    }
    
    public void setSoloActivos(Boolean soloActivos) {
        this.soloActivos = soloActivos;
    }
    
    public Map<String, Object> getProcessData() {
        return processData;
    }
    
    public void setProcessData(Map<String, Object> processData) {
        this.processData = processData;
    }
    
    @Override
    public String toString() {
        return "ProcessSaveRequest{" +
                "numeroRadicacion='" + numeroRadicacion + '\'' +
                ", soloActivos=" + soloActivos +
                ", hasProcessData=" + (processData != null) +
                '}';
    }
}