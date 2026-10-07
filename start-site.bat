@echo off
setlocal
cd /d "%~dp0"

echo Checking MySQL...
sc.exe query mysql | findstr /I "RUNNING" >nul
if errorlevel 1 (
    echo MySQL is stopped. Windows will ask for administrator permission.
    powershell.exe -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -Verb RunAs -Wait -ArgumentList '/c net start mysql'"
    sc.exe query mysql | findstr /I "RUNNING" >nul
    if errorlevel 1 (
        echo Could not start MySQL. Approve the Windows prompt and try again.
        pause
        exit /b 1
    )
)

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if errorlevel 1 (
    echo Starting the website...
    start "Rasghareb website" /D "%~dp0" cmd.exe /k npm.cmd start
) else (
    echo Website already appears to be running on port 3000.
)

echo Waiting for the website to respond...
set "APP_READY="
for /L %%i in (1,1,30) do (
    powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 }; exit 1 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        set "APP_READY=1"
        goto :app_ready
    )
    timeout /t 1 /nobreak >nul
)

:app_ready
if not defined APP_READY (
    echo The website did not respond successfully on port 3000.
    echo Check the website window and make sure MySQL and the database are ready.
    pause
    exit /b 1
)

where ssh.exe >nul 2>&1
if errorlevel 1 (
    echo OpenSSH was not found. Install the Windows OpenSSH Client feature.
    pause
    exit /b 1
)

echo Starting the temporary public tunnel. Keep this window open.
ssh.exe -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes -R 80:localhost:3000 nokey@localhost.run

echo The tunnel has stopped.
pause