param([ValidateSet('Editor','Publicar','Comprobar','Funciones')][string]$Modo = 'Editor')
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $PSScriptRoot

function Find-Tool([string]$Name) {
    $candidates = @()
    if ($Name -eq 'Python') {
        foreach ($command in @('python','python3')) {
            $found = Get-Command $command -CommandType Application -ErrorAction SilentlyContinue
            if ($found) { $candidates += $found.Source }
        }
        $launcher = Get-Command py -CommandType Application -ErrorAction SilentlyContinue
        if ($launcher) {
            try {
                $resolved = & $launcher.Source -3 -c 'import sys; print(sys.executable)' 2>$null
                if ($LASTEXITCODE -eq 0) { $candidates += $resolved }
            } catch { }
        }
        foreach ($base in @("$env:LOCALAPPDATA\Programs\Python", "$env:ProgramFiles")) {
            if (Test-Path -LiteralPath $base) {
                $candidates += Get-ChildItem -LiteralPath $base -Directory -Filter 'Python*' -ErrorAction SilentlyContinue |
                    Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName 'python.exe' }
            }
        }
        $candidates += "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
        foreach ($path in ($candidates | Select-Object -Unique)) {
            if (Test-Path -LiteralPath $path -PathType Leaf) {
                try {
                    & $path -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' 2>$null
                    if ($LASTEXITCODE -eq 0) { return $path }
                } catch { }
            }
        }
    } else {
        $found = Get-Command git -CommandType Application -ErrorAction SilentlyContinue
        if ($found) { $candidates += $found.Source }
        $candidates += @("$env:LOCALAPPDATA\Programs\Git\cmd\git.exe", "$env:ProgramFiles\Git\cmd\git.exe",
            "${env:ProgramFiles(x86)}\Git\cmd\git.exe",
            "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe")
        foreach ($path in ($candidates | Select-Object -Unique)) {
            if (Test-Path -LiteralPath $path -PathType Leaf) {
                try { & $path --version *> $null; if ($LASTEXITCODE -eq 0) { return $path } } catch { }
            }
        }
    }
    return $null
}

function Install-Tool([string]$Name) {
    $winget = Get-Command winget -CommandType Application -ErrorAction SilentlyContinue
    if (-not $winget) {
        throw 'Este Windows no tiene WinGet. Instala o actualiza "Instalador de aplicaciones" de Microsoft Store y vuelve a abrir este archivo: https://apps.microsoft.com/detail/9nblggh4nns1'
    }
    $package = if ($Name -eq 'Python') { 'Python.Python.3.14' } else { 'Git.Git' }
    Write-Host "Falta $Name. Instalando para este usuario..."
    & $winget.Source install --id $package --exact --source winget --scope user --silent --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) { throw "No se pudo instalar $Name. Revisa el mensaje anterior y tu conexion a Internet." }
    $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path','User') + ';' + $env:Path
}

function Ensure-Tool([string]$Name) {
    $path = Find-Tool $Name
    if ($path) { Write-Host "$Name disponible. Se omite la instalacion."; return $path }
    Install-Tool $Name
    $path = Find-Tool $Name
    if (-not $path) { throw "$Name se instalo pero no se pudo localizar. Cierra esta ventana y abre el archivo de nuevo." }
    return $path
}

function Invoke-Git([string[]]$GitArgs) {
    & $script:gitExe --no-pager -C $siteRoot @GitArgs
    if ($LASTEXITCODE -ne 0) { throw 'Git no pudo completar la operacion. Tus cambios locales siguen guardados.' }
}

if ($Modo -eq 'Funciones') { return }
try {
    if ($Modo -eq 'Comprobar') {
        foreach ($name in @('Python','Git')) {
            $path = Find-Tool $name
            if ($path) { Write-Host "$name disponible: $path" }
            else { Write-Host "$name falta; se instalara cuando lo necesites." }
        }
    } elseif ($Modo -eq 'Editor') {
        $pythonExe = Ensure-Tool 'Python'
        Write-Host 'Abriendo el editor. Manten esta ventana abierta mientras trabajas.'
        & $pythonExe (Join-Path $siteRoot 'scripts\editor.py') --port 0
        if ($LASTEXITCODE -ne 0) { throw 'El editor no pudo iniciarse. Revisa el mensaje anterior.' }
    } else {
        $script:gitExe = Ensure-Tool 'Git'
        if (-not (Test-Path -LiteralPath (Join-Path $siteRoot '.git'))) {
            throw 'Falta el historial .git. Utiliza la carpeta completa del sitio sincronizada por Drive, no solamente los archivos HTML.'
        }
        Write-Host 'Publicando los cambios guardados... En otra PC, GitHub puede pedirte iniciar sesion.'
        Invoke-Git @('fetch','origin')
        Invoke-Git @('merge','--ff-only','origin/main')
        Invoke-Git @('add','--all')
        Invoke-Git @('diff','--cached','--check')
        & $script:gitExe --no-pager -C $siteRoot diff --cached --quiet
        $diffCode = $LASTEXITCODE
        if ($diffCode -gt 1) { throw 'No se pudieron revisar los cambios.' }
        if ($diffCode -eq 1) {
            Invoke-Git @('-c','user.name=Ivan Perez','-c','user.email=maper.asesores@gmail.com','commit','-m','Actualiza datos del sitio MAPER')
        }
        Invoke-Git @('push','origin','main')
        Write-Host 'Cambios enviados a GitHub. La web puede tardar unos minutos en actualizarse.'
        Write-Host 'https://maper-consultores.github.io/'
    }
    exit 0
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
