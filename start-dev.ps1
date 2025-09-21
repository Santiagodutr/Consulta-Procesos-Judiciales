# Script para iniciar ambos servidores (Frontend y Backend)
Write-Host "🚀 Iniciando servidores de desarrollo..." -ForegroundColor Green

# Ruta del proyecto
$projectRoot = "C:\Users\USUARIO\OneDrive\Documentos\sw2\Consulta-Procesos-Judiciales"

Write-Host "📁 Directorio del proyecto: $projectRoot" -ForegroundColor Yellow

# Iniciar Backend en una nueva ventana de PowerShell
Write-Host "🔧 Iniciando Backend (Puerto 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\BACKEND'; npm run dev"

# Esperar un poco para que el backend se inicie
Start-Sleep -Seconds 3

# Iniciar Frontend en otra nueva ventana de PowerShell
Write-Host "🎨 Iniciando Frontend (Puerto 3000)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\FRONT-END-WEB'; npm start"

Write-Host "✅ Ambos servidores están iniciándose..." -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "🔧 Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "📝 Presiona cualquier tecla para continuar..." -ForegroundColor Yellow

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")