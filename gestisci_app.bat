@echo off
TITLE Leapmotor Hub Controller
color 0A

echo ==========================================
echo    LEAPMOTOR T03 HUB - GESTORE APP
echo ==========================================

:: Imposta i percorsi
set BASE_DIR=C:\LeepMotorApp
set BACKEND_DIR=%BASE_DIR%\backend
set FRONTEND_DIR=%BASE_DIR%\frontend

:: Controllo se i percorsi esistono
if not exist "%BACKEND_DIR%" (
    echo [ERRORE] Cartella Backend non trovata!
    pause
    exit
)

:: Avvio Backend
echo [1/2] Avvio Backend (FastAPI)...
:: Usiamo START con un titolo specifico per poterlo chiudere dopo
start "LP_BACKEND" /min cmd /c "cd /d %BACKEND_DIR% && python main.py"

:: Avvio Frontend
echo [2/2] Avvio Frontend (Vite)...
:: Usiamo START con un titolo specifico
start "LP_FRONTEND" /min cmd /c "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo [+] SERVIZI AVVIATI!
echo ------------------------------------------
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo ------------------------------------------
echo.
echo PREMI UN TASTO PER CHIUDERE TUTTO...
pause > nul

echo.
echo [-] Arresto in corso...

:: Chiudiamo i processi basandoci sul titolo della finestra
taskkill /FI "WINDOWTITLE eq LP_BACKEND" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq LP_FRONTEND" /T /F > nul 2>&1

:: Pulizia extra per node e python se necessario (opzionale)
:: taskkill /IM node.exe /F > nul 2>&1

echo [!] Applicazione chiusa. Alla prossima!
timeout /t 3
