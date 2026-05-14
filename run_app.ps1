# Script per avviare Leapmotor T03 Hub (Backend + Frontend)

$BackendDir = "C:\LeepMotorApp\backend"
$FrontendDir = "C:\LeepMotorApp\frontend"

Write-Host "--- Avvio Leapmotor T03 Hub ---" -ForegroundColor Cyan

# 1. Avvio Backend (FastAPI)
Write-Host "[1/2] Avvio Backend su http://localhost:8000..." -ForegroundColor Yellow
$BackendJob = Start-Job -ScriptBlock {
    param($dir)
    cd $dir
    python main.py
} -ArgumentList $BackendDir

# 2. Avvio Frontend (Vite)
Write-Host "[2/2] Avvio Frontend su http://localhost:5173..." -ForegroundColor Yellow
$FrontendJob = Start-Job -ScriptBlock {
    param($dir)
    cd $dir
    # Usiamo cmd /c per evitare problemi con le policy di esecuzione di npm
    cmd /c npm run dev
} -ArgumentList $FrontendDir

Write-Host "`nApp pronta! Premi un tasto qualsiasi per fermare i server..." -ForegroundColor Green

# Attesa input utente
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nArresto in corso..." -ForegroundColor Red

# Fermo i job
Stop-Job $BackendJob
Remove-Job $BackendJob
Stop-Job $FrontendJob
Remove-Job $FrontendJob

# Chiudo eventuali processi rimasti (opzionale ma utile per pulizia)
$BackendProcess = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*main.py*" }
if ($BackendProcess) { Stop-Process -Id $BackendProcess.Id -Force }

Write-Host "Tutti i servizi sono stati arrestati. Alla prossima!" -ForegroundColor Cyan
