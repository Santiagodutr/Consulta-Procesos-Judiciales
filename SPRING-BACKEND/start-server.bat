@echo off
echo ================================
echo   SPRING BOOT SERVER STARTER
echo ================================
echo.

REM Configurar JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-22
echo Java configurado: %JAVA_HOME%

REM Cambiar al directorio del proyecto
cd /d "%~dp0"
echo Directorio actual: %CD%

echo.
echo Iniciando servidor Spring Boot...
echo Puerto: 8080
echo Presiona Ctrl+C para detener el servidor
echo.

REM Ejecutar Spring Boot
.\mvnw.cmd spring-boot:run

echo.
echo Servidor detenido. Presiona cualquier tecla para cerrar...
pause