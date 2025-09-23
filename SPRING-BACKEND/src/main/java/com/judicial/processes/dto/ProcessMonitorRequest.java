package com.judicial.processes.dto;

import jakarta.validation.constraints.NotBlank;

public class ProcessMonitorRequest {
    
    @NotBlank(message = "El número de radicación es requerido")
    private String numeroRadicacion;
    
    private String role = "observer"; // Default role
    private String alias;
    
    // Constructors
    public ProcessMonitorRequest() {}
    
    public ProcessMonitorRequest(String numeroRadicacion) {
        this.numeroRadicacion = numeroRadicacion;
        this.role = "observer";
    }
    
    public ProcessMonitorRequest(String numeroRadicacion, String role, String alias) {
        this.numeroRadicacion = numeroRadicacion;
        this.role = role;
        this.alias = alias;
    }
    
    // Getters and Setters
    public String getNumeroRadicacion() { return numeroRadicacion; }
    public void setNumeroRadicacion(String numeroRadicacion) { this.numeroRadicacion = numeroRadicacion; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
}