Write-Host "=========================================="
Write-Host "   CONFIGURACION COMPLETA PARA RAILWAY"  
Write-Host "=========================================="

# Cambiar al directorio correcto
Set-Location "C:\Users\USUARIO\OneDrive\Documentos\sw2\Consulta-Procesos-Judiciales\SPRING-BACKEND"

Write-Host ""
Write-Host "[1/4] Verificando directorio..."
if (Test-Path "pom.xml") {
    Write-Host "OK - Directorio correcto" -ForegroundColor Green
} else {
    Write-Host "ERROR - No se encontro pom.xml" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Verificando archivos Railway..."
$files = @("Dockerfile", "railway.json", ".railwayignore")
foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "OK - $f encontrado" -ForegroundColor Green
    } else {
        Write-Host "FALTA - $f" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[3/4] Compilando proyecto..."
try {
    & ".\mvnw.cmd" clean compile -q
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Compilacion exitosa" -ForegroundColor Green
    } else {
        Write-Host "ADVERTENCIA - Error en compilacion" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ADVERTENCIA - No se pudo compilar" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/4] Preparando Git..."
try {
    git add .
    Write-Host "OK - Archivos agregados a Git" -ForegroundColor Green
} catch {
    Write-Host "ADVERTENCIA - Git no disponible" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================="
Write-Host "           CONFIGURACION COMPLETA!"
Write-Host "=========================================="
Write-Host ""
Write-Host "EJECUTA ESTOS COMANDOS:"
Write-Host "git commit -m 'Add Railway configuration'"
Write-Host "git push origin main"
Write-Host ""
Write-Host "PASOS EN RAILWAY:"
Write-Host "1. Ve a railway.app"
Write-Host "2. New Project > Deploy from GitHub"
Write-Host "3. Selecciona tu repositorio"
Write-Host "4. IMPORTANTE: Elige directorio SPRING-BACKEND"
Write-Host "5. Railway usara el Dockerfile automaticamente"
Write-Host ""
Write-Host "VARIABLES DE ENTORNO NECESARIAS:"
Write-Host "SUPABASE_URL=tu-url-supabase"
Write-Host "SUPABASE_KEY=tu-key-supabase"
Write-Host "MAIL_HOST=smtp.gmail.com"
Write-Host "MAIL_PORT=587"
Write-Host "MAIL_USERNAME=tu-email"
Write-Host "MAIL_PASSWORD=tu-password"
Write-Host "CORS_ORIGINS=*"
Write-Host "SPRING_PROFILES_ACTIVE=prod"
Write-Host ""
Write-Host "=========================================="