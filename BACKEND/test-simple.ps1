# Pruebas simples para la API Judicial
# Ejecutar estas pruebas una por una para validar el funcionamiento

Write-Host "=== PRUEBAS BÁSICAS API JUDICIAL ===" -ForegroundColor Cyan
Write-Host ""

# Configuración
$baseUrl = "http://localhost:8000"
$headers = @{"Content-Type" = "application/json"}

# Prueba 1: Consulta con el número específico proporcionado
Write-Host "1. Probando consulta con número 50001333300820170020700..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/judicial/consult" -Method Post -Headers $headers -Body '{"numeroRadicacion":"50001333300820170020700"}' -ErrorAction Stop
    Write-Host "✅ Consulta exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en consulta:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Prueba 2: Búsqueda simple
Write-Host "2. Probando búsqueda simple..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/judicial/search?numero=50001" -Method Get -ErrorAction Stop
    Write-Host "✅ Búsqueda exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2
} catch {
    Write-Host "❌ Error en búsqueda:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""

# Prueba 3: Verificar que el servidor responde
Write-Host "3. Verificando que el servidor responde..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Servidor funcionando:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Servidor no responde en /health, probando ruta principal..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/" -Method Get -ErrorAction Stop
        Write-Host "✅ Servidor funcionando en ruta principal" -ForegroundColor Green
    } catch {
        Write-Host "❌ Servidor no responde:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Magenta
Write-Host "1. Si todas las pruebas fallan, verifica que el servidor esté corriendo:" -ForegroundColor White
Write-Host "   cd BACKEND && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Si solo la consulta falla, es normal - el portal puede estar bloqueando requests automáticos" -ForegroundColor White
Write-Host ""
Write-Host "3. Para probar manualmente, ve a:" -ForegroundColor White
Write-Host "   https://consultaprocesos.ramajudicial.gov.co" -ForegroundColor Gray
Write-Host "   Y busca el número: 50001333300820170020700" -ForegroundColor Gray