@echo off
REM Quick Setup Script for Windows - Consulta Procesos Judiciales
REM This script helps set up the development environment quickly

echo 🚀 Configuración Rápida - Sistema de Consulta de Procesos Judiciales
echo ==================================================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Node.js no está instalado. Instala Node.js 18+ primero.
    pause
    exit /b 1
)

echo ✅ Node.js detectado: 
node -v

echo.
echo 📦 Configurando Backend...
echo ------------------------
if exist "BACKEND" (
    cd BACKEND
    echo 📥 Instalando dependencias del backend...
    call npm install
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Dependencias del backend instaladas correctamente
    ) else (
        echo ❌ Error instalando dependencias del backend
    )
    
    if exist ".env.example" (
        if not exist ".env" (
            copy .env.example .env >nul
            echo 📝 Archivo .env creado desde .env.example
            echo ⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales
        )
    )
    cd ..
) else (
    echo ❌ Directorio BACKEND no encontrado
)

echo.
echo 📦 Configurando Frontend Web...
echo ------------------------------
if exist "FRONT-END-WEB" (
    cd FRONT-END-WEB
    echo 📥 Instalando dependencias del frontend web...
    call npm install
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Dependencias del frontend web instaladas correctamente
    ) else (
        echo ❌ Error instalando dependencias del frontend web
    )
    
    if exist ".env.example" (
        if not exist ".env.local" (
            copy .env.example .env.local >nul
            echo 📝 Archivo .env.local creado desde .env.example
            echo ⚠️  IMPORTANTE: Edita el archivo .env.local con tus URLs
        )
    )
    cd ..
) else (
    echo ❌ Directorio FRONT-END-WEB no encontrado
)

echo.
echo 📦 Configurando Mobile App...
echo ----------------------------
if exist "MOBILE-APP" (
    cd MOBILE-APP
    echo 📥 Instalando dependencias de la app móvil...
    call npm install
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Dependencias de la app móvil instaladas correctamente
    ) else (
        echo ❌ Error instalando dependencias de la app móvil
    )
    
    if exist ".env.example" (
        if not exist ".env" (
            copy .env.example .env >nul
            echo 📝 Archivo .env creado desde .env.example
            echo ⚠️  IMPORTANTE: Edita el archivo .env con tus URLs
        )
    )
    cd ..
) else (
    echo ❌ Directorio MOBILE-APP no encontrado
)

echo.
echo 🎉 CONFIGURACIÓN COMPLETADA
echo ==========================
echo.
echo 📋 PRÓXIMOS PASOS:
echo.
echo 1. 🔑 Configurar Supabase:
echo    - Crear proyecto en https://supabase.com
echo    - Ejecutar BACKEND/database/schema.sql en SQL Editor
echo    - Copiar URL y API keys
echo.
echo 2. ⚙️  Configurar archivos .env:
echo    - BACKEND/.env (Supabase + SMTP + Twilio)
echo    - FRONT-END-WEB/.env.local (URLs del backend)
echo    - MOBILE-APP/.env (URLs del backend)
echo.
echo 3. 🚀 Ejecutar los servicios:
echo    Backend:     cd BACKEND ^&^& npm run dev
echo    Frontend:    cd FRONT-END-WEB ^&^& npm start  
echo    Mobile:      cd MOBILE-APP ^&^& npx expo start
echo.
echo 4. 🌐 Acceder a las aplicaciones:
echo    Backend:     http://localhost:3000/api/health
echo    Frontend:    http://localhost:3001
echo    Mobile:      Escanea QR con Expo Go
echo.
echo 📖 Para más detalles, ver INSTALLATION.md
echo.
echo ✨ ¡Listo para desarrollar!
echo.
pause