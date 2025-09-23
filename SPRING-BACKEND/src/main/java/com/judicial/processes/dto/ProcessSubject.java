package com.judicial.processes.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ProcessSubject {
    
    @JsonProperty("id_sujeto_proceso")
    private Long idSujetoProceso;
    
    @JsonProperty("nombre_sujeto")
    private String nombreSujeto;
    
    @JsonProperty("tipo_sujeto")
    private String tipoSujeto;
    
    private String identificacion;
    
    @JsonProperty("tipo_identificacion")
    private String tipoIdentificacion;
    
    private String apoderado;
    
    @JsonProperty("tiene_apoderado")
    private Boolean tieneApoderado;
    
    // Constructors
    public ProcessSubject() {}
    
    public ProcessSubject(String nombreSujeto, String tipoSujeto) {
        this.nombreSujeto = nombreSujeto;
        this.tipoSujeto = tipoSujeto;
        this.tieneApoderado = false;
    }
    
    // Getters and Setters
    public Long getIdSujetoProceso() { return idSujetoProceso; }
    public void setIdSujetoProceso(Long idSujetoProceso) { this.idSujetoProceso = idSujetoProceso; }
    
    public String getNombreSujeto() { return nombreSujeto; }
    public void setNombreSujeto(String nombreSujeto) { this.nombreSujeto = nombreSujeto; }
    
    public String getTipoSujeto() { return tipoSujeto; }
    public void setTipoSujeto(String tipoSujeto) { this.tipoSujeto = tipoSujeto; }
    
    public String getIdentificacion() { return identificacion; }
    public void setIdentificacion(String identificacion) { this.identificacion = identificacion; }
    
    public String getTipoIdentificacion() { return tipoIdentificacion; }
    public void setTipoIdentificacion(String tipoIdentificacion) { this.tipoIdentificacion = tipoIdentificacion; }
    
    public String getApoderado() { return apoderado; }
    public void setApoderado(String apoderado) { this.apoderado = apoderado; }
    
    public Boolean getTieneApoderado() { return tieneApoderado; }
    public void setTieneApoderado(Boolean tieneApoderado) { this.tieneApoderado = tieneApoderado; }
}