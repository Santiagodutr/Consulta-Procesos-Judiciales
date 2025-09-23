package com.judicial.processes.dto;

import jakarta.validation.constraints.NotBlank;

public class ProcessConsultRequest {
    
    @NotBlank(message = "El número de radicación es requerido")
    private String numeroRadicacion;
    
    private Boolean soloActivos;
    
    // Constructors
    public ProcessConsultRequest() {}
    
    public ProcessConsultRequest(String numeroRadicacion) {
        this.numeroRadicacion = numeroRadicacion;
    }
    
    public ProcessConsultRequest(String numeroRadicacion, Boolean soloActivos) {
        this.numeroRadicacion = numeroRadicacion;
        this.soloActivos = soloActivos;
    }
    
    // Getters and Setters
    public String getNumeroRadicacion() { return numeroRadicacion; }
    public void setNumeroRadicacion(String numeroRadicacion) { this.numeroRadicacion = numeroRadicacion; }
    public Boolean getSoloActivos() { return soloActivos; }
    public void setSoloActivos(Boolean soloActivos) { this.soloActivos = soloActivos; }
}