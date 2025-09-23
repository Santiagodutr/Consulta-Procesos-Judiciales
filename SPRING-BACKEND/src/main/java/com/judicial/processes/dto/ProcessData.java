package com.judicial.processes.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ProcessData {
    
    // Portal API fields
    @JsonProperty("id_proceso")
    private Long idProceso;
    
    @JsonProperty("id_conexion")
    private Long idConexion;
    
    @JsonProperty("numero_radicacion")
    private String numeroRadicacion;
    
    // Date fields
    @JsonProperty("fecha_radicacion")
    private String fechaRadicacion;
    
    @JsonProperty("fecha_proceso")
    private String fechaProceso;
    
    @JsonProperty("fecha_ultima_actuacion")
    private String fechaUltimaActuacion;
    
    // Court and case info
    private String despacho;
    private String departamento;
    private String ponente;
    
    @JsonProperty("ubicacion_expediente")
    private String ubicacionExpediente;
    
    @JsonProperty("tipo_proceso")
    private String tipoProceso;
    
    @JsonProperty("clase_proceso")
    private String claseProceso;
    
    @JsonProperty("subclase_proceso")
    private String subclaseProceso;
    
    // Parties information
    private String demandante;
    private String demandado;
    
    @JsonProperty("sujetos_procesales")
    private String sujetosProcesales;
    
    @JsonProperty("apoderado_demandante")
    private String apoderadoDemandante;
    
    @JsonProperty("apoderado_demandado")
    private String apoderadoDemandado;
    
    // Process metadata
    @JsonProperty("cantidad_folios")
    private Integer cantidadFolios;
    
    @JsonProperty("es_privado")
    private Boolean esPrivado;
    
    private String estado;
    
    @JsonProperty("solo_activos")
    private Boolean soloActivos;
    
    @JsonProperty("portal_url")
    private String portalUrl;
    
    // Related data
    private List<ProcessActivity> actuaciones;
    private List<ProcessSubject> sujetos;
    private List<ProcessDocument> documentos;
    
    // Constructors
    public ProcessData() {}
    
    public ProcessData(String numeroRadicacion, String fechaRadicacion, String despacho, 
                      String demandante, String demandado, String tipoProceso) {
        this.numeroRadicacion = numeroRadicacion;
        this.fechaRadicacion = fechaRadicacion;
        this.despacho = despacho;
        this.demandante = demandante;
        this.demandado = demandado;
        this.tipoProceso = tipoProceso;
    }
    
    // Getters and Setters
    public Long getIdProceso() { return idProceso; }
    public void setIdProceso(Long idProceso) { this.idProceso = idProceso; }
    
    public Long getIdConexion() { return idConexion; }
    public void setIdConexion(Long idConexion) { this.idConexion = idConexion; }
    
    public String getNumeroRadicacion() { return numeroRadicacion; }
    public void setNumeroRadicacion(String numeroRadicacion) { this.numeroRadicacion = numeroRadicacion; }
    
    public String getFechaRadicacion() { return fechaRadicacion; }
    public void setFechaRadicacion(String fechaRadicacion) { this.fechaRadicacion = fechaRadicacion; }
    
    public String getFechaProceso() { return fechaProceso; }
    public void setFechaProceso(String fechaProceso) { this.fechaProceso = fechaProceso; }
    
    public String getFechaUltimaActuacion() { return fechaUltimaActuacion; }
    public void setFechaUltimaActuacion(String fechaUltimaActuacion) { this.fechaUltimaActuacion = fechaUltimaActuacion; }
    
    public String getDespacho() { return despacho; }
    public void setDespacho(String despacho) { this.despacho = despacho; }
    
    public String getDepartamento() { return departamento; }
    public void setDepartamento(String departamento) { this.departamento = departamento; }
    
    public String getPonente() { return ponente; }
    public void setPonente(String ponente) { this.ponente = ponente; }
    
    public String getUbicacionExpediente() { return ubicacionExpediente; }
    public void setUbicacionExpediente(String ubicacionExpediente) { this.ubicacionExpediente = ubicacionExpediente; }
    
    public String getTipoProceso() { return tipoProceso; }
    public void setTipoProceso(String tipoProceso) { this.tipoProceso = tipoProceso; }
    
    public String getClaseProceso() { return claseProceso; }
    public void setClaseProceso(String claseProceso) { this.claseProceso = claseProceso; }
    
    public String getSubclaseProceso() { return subclaseProceso; }
    public void setSubclaseProceso(String subclaseProceso) { this.subclaseProceso = subclaseProceso; }
    
    public String getDemandante() { return demandante; }
    public void setDemandante(String demandante) { this.demandante = demandante; }
    
    public String getDemandado() { return demandado; }
    public void setDemandado(String demandado) { this.demandado = demandado; }
    
    public String getSujetosProcesales() { return sujetosProcesales; }
    public void setSujetosProcesales(String sujetosProcesales) { this.sujetosProcesales = sujetosProcesales; }
    
    public String getApoderadoDemandante() { return apoderadoDemandante; }
    public void setApoderadoDemandante(String apoderadoDemandante) { this.apoderadoDemandante = apoderadoDemandante; }
    
    public String getApoderadoDemandado() { return apoderadoDemandado; }
    public void setApoderadoDemandado(String apoderadoDemandado) { this.apoderadoDemandado = apoderadoDemandado; }
    
    public Integer getCantidadFolios() { return cantidadFolios; }
    public void setCantidadFolios(Integer cantidadFolios) { this.cantidadFolios = cantidadFolios; }
    
    public Boolean getEsPrivado() { return esPrivado; }
    public void setEsPrivado(Boolean esPrivado) { this.esPrivado = esPrivado; }
    
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    
    public Boolean getSoloActivos() { return soloActivos; }
    public void setSoloActivos(Boolean soloActivos) { this.soloActivos = soloActivos; }
    
    public String getPortalUrl() { return portalUrl; }
    public void setPortalUrl(String portalUrl) { this.portalUrl = portalUrl; }
    
    public List<ProcessActivity> getActuaciones() { return actuaciones; }
    public void setActuaciones(List<ProcessActivity> actuaciones) { this.actuaciones = actuaciones; }
    
    public List<ProcessSubject> getSujetos() { return sujetos; }
    public void setSujetos(List<ProcessSubject> sujetos) { this.sujetos = sujetos; }
    
    public List<ProcessDocument> getDocumentos() { return documentos; }
    public void setDocumentos(List<ProcessDocument> documentos) { this.documentos = documentos; }
}