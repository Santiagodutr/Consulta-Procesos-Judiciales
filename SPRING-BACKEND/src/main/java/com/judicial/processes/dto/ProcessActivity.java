package com.judicial.processes.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ProcessActivity {
    
    @JsonProperty("id_actuacion")
    private Long idActuacion;
    
    @JsonProperty("cons_actuacion")
    private Long consActuacion;
    
    @JsonProperty("fecha_actuacion")
    private String fechaActuacion;
    
    private String actuacion;
    private String anotacion;
    
    @JsonProperty("fecha_inicio_termino")
    private String fechaInicioTermino;
    
    @JsonProperty("fecha_finaliza_termino")
    private String fechaFinalizaTermino;
    
    @JsonProperty("codigo_regla")
    private String codigoRegla;
    
    @JsonProperty("con_documentos")
    private Boolean conDocumentos;
    
    @JsonProperty("cant_folios")
    private Integer cantFolios;
    
    // Constructors
    public ProcessActivity() {}
    
    public ProcessActivity(String fechaActuacion, String actuacion) {
        this.fechaActuacion = fechaActuacion;
        this.actuacion = actuacion;
        this.conDocumentos = false;
        this.cantFolios = 0;
    }
    
    // Getters and Setters
    public Long getIdActuacion() { return idActuacion; }
    public void setIdActuacion(Long idActuacion) { this.idActuacion = idActuacion; }
    
    public Long getConsActuacion() { return consActuacion; }
    public void setConsActuacion(Long consActuacion) { this.consActuacion = consActuacion; }
    
    public String getFechaActuacion() { return fechaActuacion; }
    public void setFechaActuacion(String fechaActuacion) { this.fechaActuacion = fechaActuacion; }
    
    public String getActuacion() { return actuacion; }
    public void setActuacion(String actuacion) { this.actuacion = actuacion; }
    
    public String getAnotacion() { return anotacion; }
    public void setAnotacion(String anotacion) { this.anotacion = anotacion; }
    
    public String getFechaInicioTermino() { return fechaInicioTermino; }
    public void setFechaInicioTermino(String fechaInicioTermino) { this.fechaInicioTermino = fechaInicioTermino; }
    
    public String getFechaFinalizaTermino() { return fechaFinalizaTermino; }
    public void setFechaFinalizaTermino(String fechaFinalizaTermino) { this.fechaFinalizaTermino = fechaFinalizaTermino; }
    
    public String getCodigoRegla() { return codigoRegla; }
    public void setCodigoRegla(String codigoRegla) { this.codigoRegla = codigoRegla; }
    
    public Boolean getConDocumentos() { return conDocumentos; }
    public void setConDocumentos(Boolean conDocumentos) { this.conDocumentos = conDocumentos; }
    
    public Integer getCantFolios() { return cantFolios; }
    public void setCantFolios(Integer cantFolios) { this.cantFolios = cantFolios; }
}