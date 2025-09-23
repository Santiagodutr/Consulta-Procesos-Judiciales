# Script completo para configurar Railway en una sola ejecución
param(
    [switch]$SkipBuild
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CONFIGURACIÓN COMPLETA PARA RAILWAY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Paso 1: Verificar directorio
Write-Host "`n[1/6] Verificando directorio..." -ForegroundColor Yellow
Set-Location "C:\Users\USUARIO\OneDrive\Documentos\sw2\Consulta-Procesos-Judiciales\SPRING-BACKEND"

if (!(Test-Path "pom.xml")) {
    Write-Host "❌ Error: No se encontró pom.xml" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Directorio correcto" -ForegroundColor Green

# Paso 2: Compilar proyecto (opcional)
if (!$SkipBuild) {
    Write-Host "`n[2/6] Compilando proyecto..." -ForegroundColor Yellow
    & ".\mvnw.cmd" clean compile -q
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilación exitosa" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Advertencia: Error en compilación, pero continuando..." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[2/6] Saltando compilación..." -ForegroundColor Yellow
}

# Paso 3: Verificar archivos Railway
Write-Host "`n[3/6] Verificando archivos de configuración..." -ForegroundColor Yellow
$files = @("Dockerfile", "railway.json", ".railwayignore", "nixpacks.toml")
$allPresent = $true
foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "✅ $f" -ForegroundColor Green
    } else {
        Write-Host "❌ $f NO encontrado" -ForegroundColor Red
        $allPresent = $false
    }
}

if (!$allPresent) {
    Write-Host "❌ Faltan archivos de configuración" -ForegroundColor Red
    exit 1
}

# Paso 4: Mostrar contenido de Dockerfile
Write-Host "`n[4/6] Contenido del Dockerfile:" -ForegroundColor Yellow
Write-Host "--------------------------------"
Get-Content "Dockerfile" | Select-Object -First 10
Write-Host "... (archivo completo creado) ..."
Write-Host "--------------------------------"

# Paso 5: Preparar Git
Write-Host "`n[5/6] Preparando cambios para Git..." -ForegroundColor Yellow
try {
    git add .
    git status --short
    Write-Host "✅ Archivos agregados a Git" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Git no disponible o no inicializado" -ForegroundColor Yellow
}

# Paso 6: Instrucciones finales
Write-Host "`n[6/6] ¡CONFIGURACIÓN COMPLETA!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`n📋 COMANDOS PARA EJECUTAR:" -ForegroundColor White -BackgroundColor Blue
Write-Host ""
Write-Host "git commit -m `"Add Railway configuration files`""
Write-Host "git push origin main"
Write-Host ""

Write-Host "🌐 PASOS EN RAILWAY.APP:" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host "1. Ve a https://railway.app"
Write-Host "2. Click 'New Project' → 'Deploy from GitHub repo'"
Write-Host "3. Selecciona: Consulta-Procesos-Judiciales"
Write-Host "4. ⚠️  IMPORTANTE: Selecciona directorio 'SPRING-BACKEND' como root"
Write-Host "5. Railway detectará automáticamente el Dockerfile"
Write-Host ""

Write-Host "⚙️  VARIABLES DE ENTORNO EN RAILWAY:" -ForegroundColor White -BackgroundColor DarkMagenta
Write-Host "SUPABASE_URL=https://tu-proyecto.supabase.co"
Write-Host "SUPABASE_KEY=tu-anon-key"
Write-Host "MAIL_HOST=smtp.gmail.com"
Write-Host "MAIL_PORT=587"
Write-Host "MAIL_USERNAME=tu-email@gmail.com"
Write-Host "MAIL_PASSWORD=tu-app-password"
Write-Host "CORS_ORIGINS=*"
Write-Host "SPRING_PROFILES_ACTIVE=prod"
Write-Host ""

Write-Host "🚀 DESPUÉS DEL DEPLOY:" -ForegroundColor White -BackgroundColor DarkCyan
Write-Host "Railway te dará una URL como:"
Write-Host "https://tu-app-production.up.railway.app"
Write-Host ""
Write-Host "Prueba la API con:"
Write-Host "curl https://tu-app-production.up.railway.app/actuator/health"
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   ¡LISTO PARA DESPLEGAR EN RAILWAY!" -ForegroundColor Green -BackgroundColor Black
Write-Host "============================================" -ForegroundColor Cyan