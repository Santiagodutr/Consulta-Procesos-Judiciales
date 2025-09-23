# ===========================================
#   SPRING BOOT SERVER STARTER (PowerShell)
# ===========================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   SPRING BOOT SERVER STARTER" -ForegroundColor Cyan  
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configurar JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Java\jdk-22"
Write-Host "Java configurado: $env:JAVA_HOME" -ForegroundColor Green

# Cambiar al directorio del script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "Directorio actual: $PWD" -ForegroundColor Yellow

Write-Host ""
Write-Host "Iniciando servidor Spring Boot..." -ForegroundColor Magenta
Write-Host "Puerto: 8080" -ForegroundColor White
Write-Host "URL: http://localhost:8080" -ForegroundColor White
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Red
Write-Host ""

# Verificar si Java está disponible
try {
    $javaVersion = & "$env:JAVA_HOME\bin\java" -version 2>&1
    Write-Host "Versión de Java detectada correctamente" -ForegroundColor Green
} catch {
    Write-Host "Error: No se puede ejecutar Java. Verifica la instalación." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Ejecutar Spring Boot
try {
    .\mvnw.cmd spring-boot:run
} catch {
    Write-Host "Error al iniciar el servidor Spring Boot" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "Servidor detenido." -ForegroundColor Yellow
    Read-Host "Presiona Enter para cerrar"
}