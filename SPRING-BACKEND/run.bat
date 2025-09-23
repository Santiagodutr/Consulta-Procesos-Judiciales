@echo off
title Spring Boot Server - Judicial Processes Backend
color 0A

set JAVA_HOME=C:\Program Files\Java\jdk-22
cd /d "%~dp0"

echo [INFO] Iniciando Spring Boot en puerto 8080...
echo [INFO] URL: http://localhost:8080
echo [INFO] Para detener: Ctrl+C
echo.

.\mvnw.cmd spring-boot:run

pause