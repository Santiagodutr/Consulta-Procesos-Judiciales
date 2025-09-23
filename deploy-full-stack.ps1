Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   DESPLIEGUE COMPLETO FRONT + BACK" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan

# Ir al directorio raíz
Set-Location "C:\Users\USUARIO\OneDrive\Documentos\sw2\Consulta-Procesos-Judiciales"

Write-Host "`n[1/5] Verificando estructura del proyecto..." -ForegroundColor Yellow
$frontendExists = Test-Path "FRONT-END-WEB\package.json"
$backendExists = Test-Path "SPRING-BACKEND\pom.xml"

if ($frontendExists) {
    Write-Host "✅ Frontend encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend NO encontrado" -ForegroundColor Red
}

if ($backendExists) {
    Write-Host "✅ Backend encontrado" -ForegroundColor Green  
} else {
    Write-Host "❌ Backend NO encontrado" -ForegroundColor Red
}

Write-Host "`n[2/5] Verificando archivos de configuración..." -ForegroundColor Yellow

# Verificar archivos backend
if (Test-Path "SPRING-BACKEND\Dockerfile") {
    Write-Host "✅ Backend Dockerfile" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Dockerfile faltante" -ForegroundColor Red
}

# Verificar archivos frontend
if (Test-Path "FRONT-END-WEB\Dockerfile") {
    Write-Host "✅ Frontend Dockerfile" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend Dockerfile faltante" -ForegroundColor Red
}

Write-Host "`n[3/5] Preparando variables de entorno..." -ForegroundColor Yellow

# Leer variables del backend
if (Test-Path "SPRING-BACKEND\.env") {
    Write-Host "✅ Variables backend encontradas" -ForegroundColor Green
    $envContent = Get-Content "SPRING-BACKEND\.env"
    Write-Host "Variables disponibles:" -ForegroundColor Cyan
    $envContent | Select-String "^[A-Z]" | ForEach-Object { Write-Host "  - $($_.Line.Split('=')[0])" }
} else {
    Write-Host "⚠️  No se encontró .env del backend" -ForegroundColor Yellow
}

Write-Host "`n[4/5] Preparando Git..." -ForegroundColor Yellow
try {
    git add .
    $status = git status --short
    if ($status) {
        Write-Host "Archivos para commit:" -ForegroundColor Cyan
        $status | ForEach-Object { Write-Host "  $_" }
    }
    Write-Host "✅ Git preparado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Git no disponible" -ForegroundColor Yellow
}

Write-Host "`n[5/5] Instrucciones de despliegue..." -ForegroundColor Yellow

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "            OPCIONES DE DESPLIEGUE" -ForegroundColor White -BackgroundColor Blue
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`n🎯 OPCIÓN 1: HÍBRIDO (RECOMENDADO)" -ForegroundColor Green
Write-Host "Backend en Railway + Frontend en Vercel"
Write-Host ""
Write-Host "1. Commitea todo:"
Write-Host "   git commit -m 'Add deployment configs'"
Write-Host "   git push origin main"
Write-Host ""
Write-Host "2. BACKEND en Railway:"
Write-Host "   - Ve a railway.app"
Write-Host "   - New Project > GitHub repo"
Write-Host "   - Selecciona: SPRING-BACKEND directory"
Write-Host "   - Configura variables de entorno"
Write-Host ""
Write-Host "3. FRONTEND en Vercel:"
Write-Host "   - Ve a vercel.com"
Write-Host "   - Import Project > GitHub"  
Write-Host "   - Root Directory: FRONT-END-WEB"
Write-Host "   - Framework: Create React App"
Write-Host ""

Write-Host "🎯 OPCIÓN 2: TODO EN RAILWAY" -ForegroundColor Yellow
Write-Host "Frontend y Backend en Railway"
Write-Host ""
Write-Host "1. Crear 2 proyectos en Railway:"
Write-Host "   Proyecto 1: Backend (SPRING-BACKEND/)"
Write-Host "   Proyecto 2: Frontend (FRONT-END-WEB/)"
Write-Host ""
Write-Host "2. Conectar cada uno a diferentes directorios"
Write-Host ""

Write-Host "📧 VARIABLES DE ENTORNO PARA RAILWAY:" -ForegroundColor Magenta
Write-Host "SUPABASE_URL=https://vhsxhehjajrunvjoqarf.supabase.co"
Write-Host "SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
Write-Host "JWT_SECRET=9fd1e6317347a75bc142cd58c0aa9800f34b..."
Write-Host "MAIL_HOST=smtp.gmail.com"
Write-Host "MAIL_USERNAME=santiagoduarteopcional@gmail.com"
Write-Host "MAIL_PASSWORD=auqc yzpq paov uhow"
Write-Host "CORS_ORIGINS=*"
Write-Host ""

Write-Host "🌐 URLS RESULTANTES:" -ForegroundColor Cyan
Write-Host "Backend:  https://tu-backend-production.up.railway.app"
Write-Host "Frontend: https://tu-frontend.vercel.app (Opción 1)"
Write-Host "Frontend: https://tu-frontend-production.up.railway.app (Opción 2)"
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "        ¡LISTO PARA DESPLEGAR!" -ForegroundColor Green -BackgroundColor Black
Write-Host "============================================" -ForegroundColor Cyan