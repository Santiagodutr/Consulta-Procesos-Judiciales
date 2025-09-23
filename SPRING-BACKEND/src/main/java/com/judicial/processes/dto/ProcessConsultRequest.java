package com.judicial.processes.dto;

import jakarta.validation.constraints.NotBlank;

public class ProcessConsultRequest {
    
    @NotBlank(message = "El número de radicación es requerido")
    private String numeroRadicacion;
    
    // Constructors
    public ProcessConsultRequest() {}
    
    public ProcessConsultRequest(String numeroRadicacion) {
        this.numeroRadicacion = numeroRadicacion;
    }
    
    // Getters and Setters
    public String getNumeroRadicacion() { return numeroRadicacion; }
    public void setNumeroRadicacion(String numeroRadicacion) { this.numeroRadicacion = numeroRadicacion; }
}