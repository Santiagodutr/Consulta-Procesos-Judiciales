# ==========================================
#     API TESTER - SPRING BOOT BACKEND
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     API TESTER - JUDICIAL PROCESSES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080"

# Función para hacer requests
function Test-API {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = @{},
        [hashtable]$Headers = @{}
    )
    
    Write-Host "🌐 $Method $Endpoint" -ForegroundColor Yellow
    
    try {
        $uri = $baseUrl + $Endpoint
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body.Count -gt 0) {
            $jsonBody = $Body | ConvertTo-Json
            $params.Body = $jsonBody
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Mostrar respuesta formateada
        $jsonResponse = $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        Write-Host "📄 Response:" -ForegroundColor White
        Write-Host $jsonResponse -ForegroundColor Gray
        
        return $response
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Verificar si el servidor está ejecutándose
Write-Host "🔍 Verificando servidor..." -ForegroundColor Magenta
try {
    $healthCheck = Invoke-WebRequest -Uri "$baseUrl/actuator/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Servidor está ejecutándose en $baseUrl" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Servidor NO está ejecutándose. Por favor ejecuta run.bat primero" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit
}

# Menu de pruebas
do {
    Write-Host "==================== MENU DE PRUEBAS ===================" -ForegroundColor Cyan
    Write-Host "1. 🏥 Health Check"
    Write-Host "2. 📝 Registrar Usuario"
    Write-Host "3. 🔑 Login Usuario"
    Write-Host "4. 👤 Obtener Perfil"
    Write-Host "5. 📊 Info del Servidor"
    Write-Host "6. 🚪 Salir"
    Write-Host "=======================================================" -ForegroundColor Cyan
    
    $option = Read-Host "Selecciona una opción (1-6)"
    
    switch ($option) {
        "1" {
            Test-API -Method "GET" -Endpoint "/actuator/health"
        }
        "2" {
            $userData = @{
                email = "test@example.com"
                password = "password123"
                fullName = "Usuario Test"
                phone = "+573001234567"
            }
            Test-API -Method "POST" -Endpoint "/auth/register" -Body $userData
        }
        "3" {
            $loginData = @{
                email = "test@example.com"
                password = "password123"
            }
            Test-API -Method "POST" -Endpoint "/auth/login" -Body $loginData
        }
        "4" {
            $token = Read-Host "Ingresa el token JWT (o presiona Enter para usar token de prueba)"
            if ([string]::IsNullOrWhiteSpace($token)) {
                $token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"
            }
            $headers = @{ "Authorization" = "Bearer $token" }
            Test-API -Method "GET" -Endpoint "/auth/profile" -Headers $headers
        }
        "5" {
            Test-API -Method "GET" -Endpoint "/actuator/info"
        }
        "6" {
            Write-Host "👋 ¡Hasta luego!" -ForegroundColor Green
            break
        }
        default {
            Write-Host "❌ Opción inválida" -ForegroundColor Red
        }
    }
    
    if ($option -ne "6") {
        Write-Host ""
        Read-Host "Presiona Enter para continuar..."
        Clear-Host
    }
    
} while ($option -ne "6")