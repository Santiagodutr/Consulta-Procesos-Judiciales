Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   DESPLIEGUE FRONTEND EN VERCEL" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan

# Ir al directorio del frontend
Set-Location "C:\Users\USUARIO\OneDrive\Documentos\sw2\Consulta-Procesos-Judiciales\FRONT-END-WEB"

Write-Host "`n[1/6] Verificando proyecto React..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✅ package.json encontrado" -ForegroundColor Green
    $packageContent = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "   Proyecto: $($packageContent.name)" -ForegroundColor Cyan
} else {
    Write-Host "❌ package.json NO encontrado" -ForegroundColor Red
    exit 1
}

if (Test-Path "src") {
    Write-Host "✅ Carpeta src encontrada" -ForegroundColor Green
} else {
    Write-Host "❌ Carpeta src NO encontrada" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/6] Verificando configuración..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    Write-Host "✅ .env.production encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ .env.production faltante" -ForegroundColor Red
}

if (Test-Path "vercel.json") {
    Write-Host "✅ vercel.json encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ vercel.json faltante" -ForegroundColor Red
}

Write-Host "`n[3/6] Instalando dependencias..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error instalando dependencias" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  npm no disponible" -ForegroundColor Yellow
}

Write-Host "`n[4/6] Probando build local..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build exitoso" -ForegroundColor Green
        if (Test-Path "build") {
            $buildFiles = Get-ChildItem "build" -Recurse | Measure-Object
            Write-Host "   Archivos generados: $($buildFiles.Count)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Error en build" -ForegroundColor Red
        Write-Host "   Revisa errores antes de desplegar" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo ejecutar build" -ForegroundColor Yellow
}

Write-Host "`n[5/6] Preparando Git..." -ForegroundColor Yellow
Set-Location "C:\Users\USUARIO\OneDrive\Documentos\sw2\Consulta-Procesos-Judiciales"
try {
    git add .
    $status = git status --short
    if ($status) {
        Write-Host "Archivos para commit:" -ForegroundColor Cyan
        $status | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }
        if ($status.Count -gt 10) {
            Write-Host "  ... y $($status.Count - 10) archivos más" -ForegroundColor Gray
        }
    }
    Write-Host "✅ Git preparado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Git no disponible" -ForegroundColor Yellow
}

Write-Host "`n[6/6] Instrucciones de despliegue..." -ForegroundColor Yellow

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "        PASOS PARA DESPLEGAR EN VERCEL" -ForegroundColor White -BackgroundColor Blue
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`n📋 PASO 1: COMMITEAR CAMBIOS" -ForegroundColor Green
Write-Host "git commit -m 'Add Vercel configuration'"
Write-Host "git push origin main"
Write-Host ""

Write-Host "🌐 PASO 2: DESPLEGAR EN VERCEL" -ForegroundColor Green
Write-Host "Opción A - Via Web (Recomendado):"
Write-Host "1. Ve a https://vercel.com"
Write-Host "2. Click 'Import Project'"
Write-Host "3. Conecta tu GitHub: Santiagodutr/Consulta-Procesos-Judiciales"
Write-Host "4. ⚠️  IMPORTANTE: Root Directory → FRONT-END-WEB"
Write-Host "5. Framework Preset → Create React App"
Write-Host "6. Click 'Deploy'"
Write-Host ""
Write-Host "Opción B - Via CLI:"
Write-Host "npm i -g vercel"
Write-Host "cd FRONT-END-WEB"
Write-Host "vercel --prod"
Write-Host ""

Write-Host "⚙️  PASO 3: CONFIGURAR VARIABLES DE ENTORNO" -ForegroundColor Magenta
Write-Host "En Vercel Dashboard → Settings → Environment Variables:"
Write-Host ""
Write-Host "REACT_APP_API_URL = https://tu-backend-production.up.railway.app"
Write-Host "REACT_APP_NAME = Consulta Procesos Judiciales"
Write-Host "GENERATE_SOURCEMAP = false"
Write-Host ""

Write-Host "🔗 PASO 4: ACTUALIZAR CORS EN BACKEND" -ForegroundColor Yellow
Write-Host "En Railway, actualizar la variable:"
Write-Host "CORS_ORIGINS = https://tu-frontend.vercel.app"
Write-Host ""

Write-Host "🚀 RESULTADO FINAL:" -ForegroundColor Cyan
Write-Host "Frontend: https://tu-proyecto.vercel.app"
Write-Host "Backend:  https://tu-backend-production.up.railway.app"
Write-Host ""

Write-Host "🧪 PASO 5: PROBAR LA CONEXIÓN" -ForegroundColor Green
Write-Host "Una vez desplegado, verifica que:"
Write-Host "1. El frontend carga correctamente"
Write-Host "2. Puede hacer login/registro"
Write-Host "3. Puede consultar procesos judiciales"
Write-Host "4. No hay errores CORS en la consola"
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "    ¡FRONTEND LISTO PARA VERCEL!" -ForegroundColor Green -BackgroundColor Black
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`n📌 COMANDOS RÁPIDOS:" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "git commit -m 'Add Vercel config' && git push origin main"
Write-Host "Luego ve a vercel.com y despliega"