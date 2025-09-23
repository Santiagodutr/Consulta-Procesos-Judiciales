# Script de despliegue rápido para Railway

# Compilar proyecto localmente (opcional)
Write-Host "=== Preparando proyecto para Railway ===" -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "pom.xml")) {
    Write-Host "Error: No se encontró pom.xml. Asegúrate de estar en el directorio SPRING-BACKEND" -ForegroundColor Red
    exit 1
}

# Limpiar y compilar para verificar que todo funciona
Write-Host "Compilando proyecto localmente..." -ForegroundColor Yellow
.\mvnw.cmd clean compile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en la compilación. Revisa los errores antes de desplegar." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Compilación exitosa" -ForegroundColor Green

# Verificar que los archivos de Railway están presentes
$requiredFiles = @("Dockerfile", "railway.json", ".railwayignore")
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file encontrado" -ForegroundColor Green
    } else {
        Write-Host "✗ $file NO encontrado" -ForegroundColor Red
    }
}

Write-Host "`n=== Pasos siguientes ===" -ForegroundColor Cyan
Write-Host "1. Commitea los cambios:"
Write-Host "   git add ."
Write-Host "   git commit -m 'Add Railway configuration'"
Write-Host "   git push origin main"
Write-Host ""
Write-Host "2. Ve a railway.app y conecta tu repositorio"
Write-Host "3. Selecciona el directorio SPRING-BACKEND como root"
Write-Host "4. Configura las variables de entorno necesarias"
Write-Host "5. ¡Railway desplegará automáticamente usando el Dockerfile!"

Write-Host "`n=== Variables de entorno para Railway ===" -ForegroundColor Cyan
Write-Host "SUPABASE_URL=https://tu-proyecto.supabase.co"
Write-Host "SUPABASE_KEY=tu-anon-key"
Write-Host "MAIL_HOST=smtp.gmail.com"
Write-Host "MAIL_PORT=587"
Write-Host "MAIL_USERNAME=tu-email@gmail.com"
Write-Host "MAIL_PASSWORD=tu-app-password"
Write-Host "CORS_ORIGINS=https://tu-frontend.vercel.app"
Write-Host "SPRING_PROFILES_ACTIVE=prod"