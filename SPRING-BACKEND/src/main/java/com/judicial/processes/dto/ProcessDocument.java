package com.judicial.processes.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ProcessDocument {
    
    @JsonProperty("id_documento")
    private Long idDocumento;
    
    @JsonProperty("nombre_archivo")
    private String nombreArchivo;
    
    @JsonProperty("tipo_documento")
    private String tipoDocumento;
    
    @JsonProperty("url_descarga")
    private String urlDescarga;
    
    @JsonProperty("tamano_archivo")
    private Long tamanoArchivo;
    
    @JsonProperty("extension_archivo")
    private String extensionArchivo;
    
    @JsonProperty("fecha_documento")
    private String fechaDocumento;
    
    // Constructors
    public ProcessDocument() {}
    
    public ProcessDocument(String nombreArchivo, String tipoDocumento) {
        this.nombreArchivo = nombreArchivo;
        this.tipoDocumento = tipoDocumento;
    }
    
    // Getters and Setters
    public Long getIdDocumento() { return idDocumento; }
    public void setIdDocumento(Long idDocumento) { this.idDocumento = idDocumento; }
    
    public String getNombreArchivo() { return nombreArchivo; }
    public void setNombreArchivo(String nombreArchivo) { this.nombreArchivo = nombreArchivo; }
    
    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }
    
    public String getUrlDescarga() { return urlDescarga; }
    public void setUrlDescarga(String urlDescarga) { this.urlDescarga = urlDescarga; }
    
    public Long getTamanoArchivo() { return tamanoArchivo; }
    public void setTamanoArchivo(Long tamanoArchivo) { this.tamanoArchivo = tamanoArchivo; }
    
    public String getExtensionArchivo() { return extensionArchivo; }
    public void setExtensionArchivo(String extensionArchivo) { this.extensionArchivo = extensionArchivo; }
    
    public String getFechaDocumento() { return fechaDocumento; }
    public void setFechaDocumento(String fechaDocumento) { this.fechaDocumento = fechaDocumento; }
}