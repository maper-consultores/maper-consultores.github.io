@echo off
setlocal
set "GIT_PAGER=cat"
set "PAGER=cat"
cd /d "%~dp0"
set "MAPER_GIT=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
if not exist "%MAPER_GIT%" --no-pager set "MAPER_GIT=git"
echo Publicando los cambios guardados del sitio MAPER...
"%MAPER_GIT%" --no-pager fetch origin
if errorlevel 1 goto failed
"%MAPER_GIT%" --no-pager merge --ff-only origin/main
if errorlevel 1 goto failed
"%MAPER_GIT%" --no-pager add --all
if errorlevel 1 goto failed
"%MAPER_GIT%" --no-pager diff --cached --check
if errorlevel 1 goto failed
"%MAPER_GIT%" --no-pager diff --cached --quiet
if errorlevel 2 goto failed
if not errorlevel 1 goto push
"%MAPER_GIT%" --no-pager -c user.name="Ivan Perez" -c user.email="maper.asesores@gmail.com" commit -m "Actualiza datos del sitio MAPER"
if errorlevel 1 goto failed
:push
"%MAPER_GIT%" --no-pager push origin main
if errorlevel 1 goto failed
echo.
echo Cambios enviados a GitHub. La web puede tardar unos minutos en actualizarse.
echo https://maper-consultores.github.io/
pause
exit /b 0
:failed
echo.
echo No se completo la publicacion. Conserva esta ventana para revisar el mensaje.
echo Tus cambios locales siguen guardados.
pause
exit /b 1
