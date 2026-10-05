@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar.ps1" -Modo Publicar
set "MAPER_RESULT=%ERRORLEVEL%"
pause
exit /b %MAPER_RESULT%
