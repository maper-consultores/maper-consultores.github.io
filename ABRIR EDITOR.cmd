@echo off
setlocal
cd /d "%~dp0"
set "MAPER_PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if exist "%MAPER_PYTHON%" (
  "%MAPER_PYTHON%" "%~dp0scripts\editor.py"
) else (
  py -3 "%~dp0scripts\editor.py"
)
pause
