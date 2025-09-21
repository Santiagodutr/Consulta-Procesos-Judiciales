# Script de pruebas para la API de Consultas Judiciales
# Asegúrate de que el servidor esté corriendo en el puerto 8000

$baseUrl = "http://localhost:8000"
$headers = @{"Content-Type" = "application/json"}

Write-Host "=== PRUEBAS DE LA API DE CONSULTAS JUDICIALES ===" -ForegroundColor Cyan
Write-Host ""

# 1. Probar la consulta pública de procesos
Write-Host "1. Probando consulta pública de procesos..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/judicial/consult" -Method Post -Headers $headers -Body '{"numeroRadicacion":"11001310300120170062900"}' -ErrorAction Stop
    Write-Host "✅ Consulta exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en consulta pública:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""

# 2. Probar búsqueda de procesos
Write-Host "2. Probando búsqueda de procesos..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/judicial/search?numero=11001&despacho=JUZGADO" -Method Get -ErrorAction Stop
    Write-Host "✅ Búsqueda exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2
} catch {
    Write-Host "❌ Error en búsqueda:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""

# 3. Probar consulta por nombre
Write-Host "3. Probando consulta por nombre..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/judicial/consult" -Method Post -Headers $headers -Body '{"nombre":"JUAN PEREZ"}' -ErrorAction Stop
    Write-Host "✅ Consulta por nombre exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en consulta por nombre:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""

# 4. Probar consulta por documento
Write-Host "4. Probando consulta por documento..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/judicial/consult" -Method Post -Headers $headers -Body '{"documento":"123456789"}' -ErrorAction Stop
    Write-Host "✅ Consulta por documento exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en consulta por documento:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""

# 5. Login para pruebas autenticadas
Write-Host "5. Haciendo login para pruebas autenticadas..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Headers $headers -Body '{"email":"admin@judicial.com","password":"Admin123456!"}' -ErrorAction Stop
    $token = $loginResponse.token
    $authHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    Write-Host "✅ Login exitoso - Token obtenido" -ForegroundColor Green
    
    # 6. Probar endpoints autenticados
    Write-Host ""
    Write-Host "6. Probando procesos monitoreados..." -ForegroundColor Yellow
    try {
        $monitoredResponse = Invoke-RestMethod -Uri "$baseUrl/api/judicial/monitored" -Method Get -Headers $authHeaders -ErrorAction Stop
        Write-Host "✅ Procesos monitoreados:" -ForegroundColor Green
        $monitoredResponse | ConvertTo-Json -Depth 2
    } catch {
        Write-Host "❌ Error en procesos monitoreados:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "7. Probando agregar proceso a monitoreados..." -ForegroundColor Yellow
    try {
        $monitorResponse = Invoke-RestMethod -Uri "$baseUrl/api/judicial/monitor" -Method Post -Headers $authHeaders -Body '{"numeroRadicacion":"11001310300120170062900"}' -ErrorAction Stop
        Write-Host "✅ Proceso agregado a monitoreados:" -ForegroundColor Green
        $monitorResponse | ConvertTo-Json -Depth 2
    } catch {
        Write-Host "❌ Error al agregar a monitoreados:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Error en login:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "No se pueden probar endpoints autenticados" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== PRUEBAS COMPLETADAS ===" -ForegroundColor Cyan

# Instrucciones adicionales
Write-Host ""
Write-Host "INSTRUCCIONES ADICIONALES:" -ForegroundColor Magenta
Write-Host "1. Asegúrate de que el backend esté corriendo: cd BACKEND; npm run dev" -ForegroundColor White
Write-Host "2. Verifica que Supabase esté configurado correctamente" -ForegroundColor White
Write-Host "3. Para probar con números reales, usa: https://consultaprocesos.ramajudicial.gov.co" -ForegroundColor White
Write-Host "4. Los números de radicación tienen formato: LLLSSSDDAARRRRRRR (23 dígitos)" -ForegroundColor White