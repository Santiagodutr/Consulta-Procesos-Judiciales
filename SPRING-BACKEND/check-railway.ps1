# Script de verificacion para Railway
Write-Host "=== Preparando proyecto para Railway ===" -ForegroundColor Green

# Verificar directorio correcto
if (!(Test-Path "pom.xml")) {
    Write-Host "Error: No se encontro pom.xml. Ejecuta desde directorio SPRING-BACKEND" -ForegroundColor Red
    exit 1
}

# Compilar proyecto
Write-Host "Compilando proyecto..." -ForegroundColor Yellow
& ".\mvnw.cmd" clean compile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en compilacion. Revisa errores antes de desplegar." -ForegroundColor Red
    exit 1
}

Write-Host "Compilacion exitosa" -ForegroundColor Green

# Verificar archivos Railway
$files = @("Dockerfile", "railway.json", ".railwayignore")
foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "✓ $f encontrado" -ForegroundColor Green
    } else {
        Write-Host "✗ $f NO encontrado" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== PASOS SIGUIENTES ===" -ForegroundColor Cyan
Write-Host "1. git add ."
Write-Host "2. git commit -m 'Add Railway config'"
Write-Host "3. git push origin main"
Write-Host "4. Ve a railway.app"
Write-Host "5. Conecta repositorio GitHub"
Write-Host "6. Selecciona directorio SPRING-BACKEND"
Write-Host "7. Configura variables de entorno"
Write-Host ""
Write-Host "Variables necesarias:"
Write-Host "SUPABASE_URL=tu-url-supabase"
Write-Host "SUPABASE_KEY=tu-key-supabase"
Write-Host "MAIL_HOST=smtp.gmail.com"
Write-Host "MAIL_PORT=587"
Write-Host "MAIL_USERNAME=tu-email"
Write-Host "MAIL_PASSWORD=tu-password"
Write-Host "CORS_ORIGINS=*"