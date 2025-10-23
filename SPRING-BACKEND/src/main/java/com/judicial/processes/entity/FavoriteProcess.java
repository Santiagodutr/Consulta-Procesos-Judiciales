package com.judicial.processes.entity;

import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

public class FavoriteProcess {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long id;
    
    @JsonProperty("user_id")
    private String userId;
    
    @JsonProperty("numero_radicacion")
    private String numeroRadicacion;
    
    private String despacho;
    private String demandante;
    private String demandado;
    
    @JsonProperty("tipo_proceso")
    private String tipoProceso;
    
    @JsonProperty("fecha_radicacion")
    private String fechaRadicacion;
    
    @JsonProperty("created_at")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXX")
    private OffsetDateTime createdAt;

    public FavoriteProcess() {
    }

    public FavoriteProcess(String userId, String numeroRadicacion, String despacho, 
                          String demandante, String demandado, String tipoProceso, 
                          String fechaRadicacion) {
        this.userId = userId;
        this.numeroRadicacion = numeroRadicacion;
        this.despacho = despacho;
        this.demandante = demandante;
        this.demandado = demandado;
        this.tipoProceso = tipoProceso;
        this.fechaRadicacion = fechaRadicacion;
        // No set id or createdAt - Supabase will generate them
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getNumeroRadicacion() {
        return numeroRadicacion;
    }

    public void setNumeroRadicacion(String numeroRadicacion) {
        this.numeroRadicacion = numeroRadicacion;
    }

    public String getDespacho() {
        return despacho;
    }

    public void setDespacho(String despacho) {
        this.despacho = despacho;
    }

    public String getDemandante() {
        return demandante;
    }

    public void setDemandante(String demandante) {
        this.demandante = demandante;
    }

    public String getDemandado() {
        return demandado;
    }

    public void setDemandado(String demandado) {
        this.demandado = demandado;
    }

    public String getTipoProceso() {
        return tipoProceso;
    }

    public void setTipoProceso(String tipoProceso) {
        this.tipoProceso = tipoProceso;
    }

    public String getFechaRadicacion() {
        return fechaRadicacion;
    }

    public void setFechaRadicacion(String fechaRadicacion) {
        this.fechaRadicacion = fechaRadicacion;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
