#!/bin/bash

# Quick Setup Script for Consulta Procesos Judiciales
# This script helps set up the development environment quickly

echo "🚀 Configuración Rápida - Sistema de Consulta de Procesos Judiciales"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado. Instala Node.js 18+ primero."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ $NODE_VERSION -lt 18 ]; then
    echo "❌ Error: Node.js versión 18+ requerida. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Function to setup a project directory
setup_project() {
    local dir=$1
    local name=$2
    
    echo ""
    echo "📦 Configurando $name..."
    echo "------------------------"
    
    if [ -d "$dir" ]; then
        cd "$dir"
        
        # Install dependencies
        echo "📥 Instalando dependencias..."
        if npm install; then
            echo "✅ Dependencias instaladas correctamente"
        else
            echo "❌ Error instalando dependencias en $name"
            return 1
        fi
        
        # Copy environment file if it doesn't exist
        if [ -f ".env.example" ] && [ ! -f ".env" ]; then
            cp .env.example .env
            echo "📝 Archivo .env creado desde .env.example"
            echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales"
        fi
        
        cd ..
    else
        echo "❌ Directorio $dir no encontrado"
        return 1
    fi
}

# Setup Backend
setup_project "BACKEND" "Backend (Node.js + Express)"

# Setup Frontend Web
setup_project "FRONT-END-WEB" "Frontend Web (React)"

# Setup Mobile App
setup_project "MOBILE-APP" "Mobile App (React Native + Expo)"

echo ""
echo "🎉 CONFIGURACIÓN COMPLETADA"
echo "=========================="
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. 🔑 Configurar Supabase:"
echo "   - Crear proyecto en https://supabase.com"
echo "   - Ejecutar BACKEND/database/schema.sql en SQL Editor"
echo "   - Copiar URL y API keys"
echo ""
echo "2. ⚙️  Configurar archivos .env:"
echo "   - BACKEND/.env (Supabase + SMTP + Twilio)"
echo "   - FRONT-END-WEB/.env.local (URLs del backend)"
echo "   - MOBILE-APP/.env (URLs del backend)"
echo ""
echo "3. 🚀 Ejecutar los servicios:"
echo "   Backend:     cd BACKEND && npm run dev"
echo "   Frontend:    cd FRONT-END-WEB && npm start"
echo "   Mobile:      cd MOBILE-APP && npx expo start"
echo ""
echo "4. 🌐 Acceder a las aplicaciones:"
echo "   Backend:     http://localhost:3000/api/health"
echo "   Frontend:    http://localhost:3001"
echo "   Mobile:      Escanea QR con Expo Go"
echo ""
echo "📖 Para más detalles, ver INSTALLATION.md"
echo ""
echo "✨ ¡Listo para desarrollar!"