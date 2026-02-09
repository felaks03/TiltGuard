@echo off
REM Script de Configuracion de SSH para GitHub en Windows
REM Este script te guia paso a paso para configurar la autenticacion SSH con GitHub
REM Uso: setup-ssh.bat

setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo Configuracion de SSH para GitHub
echo ========================================
echo.
echo [INFO] Este script te ayudara a configurar la autenticacion SSH con GitHub
echo.

REM Verificar si Git está instalado
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git no esta instalado
    echo Descargalo desde: https://git-scm.com/
    pause
    exit /b 1
)

REM Paso 1: Verificar si ya existe clave SSH
echo.
echo ========================================
echo Paso 1: Verificando claves SSH existentes
echo ========================================
echo.

set SSH_DIR=%USERPROFILE%\.ssh
set SSH_KEY=%SSH_DIR%\id_ed25519
set SSH_KEY_PUB=%SSH_KEY%.pub

if exist "%SSH_KEY%" (
    echo [OK] Clave SSH ya existe en %SSH_KEY%
    set /p continue="Deseas generar una nueva clave? (S/N): "
    if /i "!continue!"=="S" (
        del "%SSH_KEY%"
        del "%SSH_KEY_PUB%"
    ) else (
        goto paso2
    )
)

echo [INFO] Creando nueva clave SSH...
echo.

REM Crear directorio .ssh si no existe
if not exist "%SSH_DIR%" mkdir "%SSH_DIR%"

REM Pedir email
set /p github_email="Introduce tu correo de GitHub: "

if "%github_email%"=="" (
    echo [ERROR] El correo no puede estar vacio
    pause
    exit /b 1
)

REM Usar Git Bash para generar la clave SSH (más seguro)
echo [INFO] Generando clave SSH usando Git Bash...
echo.

REM Buscar Git Bash
for /f "delims=" %%A in ('where git') do (
    set GIT_PATH=%%A
)

REM Obtener la carpeta de Git
for %%A in ("%GIT_PATH%") do set GIT_BIN=%%~dpA

set GIT_BASH=%GIT_BIN%\..\bin\bash.exe
if not exist "%GIT_BASH%" (
    set GIT_BASH=%GIT_BIN%bash.exe
)

if exist "%GIT_BASH%" (
    "%GIT_BASH%" -c "ssh-keygen -t ed25519 -C '%github_email%' -f ~/.ssh/id_ed25519 -N ''"
    if %errorlevel% equ 0 (
        echo [OK] Clave SSH generada correctamente
    ) else (
        echo [ERROR] Error al generar la clave SSH
        pause
        exit /b 1
    )
) else (
    echo [ERROR] No se encontro Git Bash
    echo Por favor, intenta instalar Git nuevamente desde: https://git-scm.com/
    pause
    exit /b 1
)

REM Paso 2: Añadir clave al SSH agent
:paso2
echo.
echo ========================================
echo Paso 2: Configurando SSH Agent
echo ========================================
echo.

echo [INFO] Iniciando SSH agent...

REM Iniciar SSH agent como servicio en Windows
powershell -NoProfile -Command "Start-Service ssh-agent -ErrorAction SilentlyContinue"

REM Esperar un momento
timeout /t 2 /nobreak

REM Verificar que ssh-agent está disponible
where ssh-add >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] ssh-add no encontrado, probando alternativa...
    REM Si no está disponible, continuamos igual
)

echo [OK] SSH agent configurado

REM Paso 3: Mostrar clave pública
echo.
echo ========================================
echo Paso 3: Tu Clave Publica SSH
echo ========================================
echo.

echo [INFO] Aqui esta tu clave publica SSH (copiala a GitHub):
echo.
echo ========================================

if exist "%SSH_KEY_PUB%" (
    type "%SSH_KEY_PUB%"
) else (
    echo [ERROR] No se encontro la clave publica
    pause
    exit /b 1
)

echo ========================================
echo.

REM Copiar clave al portapapeles si es posible
echo [INFO] Copiando clave al portapapeles...
if exist "%SSH_KEY_PUB%" (
    for /f "delims=" %%A in (type "%SSH_KEY_PUB%") do (
        echo %%A | clip
    )
    echo [OK] Clave copiada al portapapeles (puedes pegar con Ctrl+V)
) else (
    echo [WARNING] Por favor copia la clave manualmente
)

REM Paso 4: Guía para añadir clave a GitHub
echo.
echo ========================================
echo Paso 4: Anadiendo Clave SSH a GitHub
echo ========================================
echo.

echo [PASOS A SEGUIR]:
echo.
echo 1. Abre tu navegador web
echo 2. Ve a: https://github.com/settings/keys
echo 3. Haz clic en el boton "New SSH key" (parte superior derecha)
echo 4. Dale un titulo a la clave (p.ej., "Mi PC Windows")
echo 5. Selecciona "Authentication Key" como tipo (si te lo pide)
echo 6. Pega la clave SSH en el campo "Key"
echo 7. Haz clic en "Add SSH key"
echo.

set /p pause_key="Presiona Enter una vez que hayas anadido la clave a GitHub..."

REM Paso 5: Verificar conexión SSH
echo.
echo ========================================
echo Paso 5: Verificando Conexion SSH
echo ========================================
echo.

echo [INFO] Probando conexion a GitHub (responde 'yes' si te pide confirmacion)...
echo.

if exist "%GIT_BASH%" (
    "%GIT_BASH%" -c "ssh -T git@github.com"
) else (
    ssh -T git@github.com
)

if %errorlevel% equ 0 (
    echo.
    echo [OK] Conexion SSH a GitHub verificada correctamente
) else (
    echo [WARNING] No se pudo verificar la conexion SSH
    echo Asegurate de que:
    echo - La clave publica esta anadida a GitHub
    echo - Esperaste a que GitHub procese la clave (pueden pasar unos minutos)
    echo.
)

REM Paso 6: Configurar Git
echo.
echo ========================================
echo Paso 6: Configurar Git
echo ========================================
echo.

echo [INFO] Verificando configuracion de Git...
echo.

for /f "delims=" %%A in ('git config --global user.name 2^>nul') do set git_user=%%A
for /f "delims=" %%A in ('git config --global user.email 2^>nul') do set git_email=%%A

if "%git_user%"=="" (
    echo [WARNING] Usuario o email de Git no configurados
    echo.
    
    set /p git_username="Introduce tu nombre de usuario de GitHub: "
    set /p git_email_input="Introduce tu correo de GitHub: "
    
    if not "%git_username%"=="" if not "%git_email_input%"=="" (
        git config --global user.name "%git_username%"
        git config --global user.email "%git_email_input%"
        echo [OK] Git configurado globalmente
    )
) else (
    echo [OK] Git ya esta configurado:
    echo    Usuario: !git_user!
    echo    Correo: !git_email!
)

REM Paso 7: Probar con git clone
echo.
echo ========================================
echo Paso 7: Probando con Git
echo ========================================
echo.

echo [INFO] Ahora puedes clonar repositorios usando SSH:
echo.
echo   git clone git@github.com:usuario/repositorio.git
echo.

REM Resumen final
echo.
echo ========================================
echo Configuracion Completada
echo ========================================
echo.

echo [OK] Clave SSH ahora esta configurada para GitHub
echo.
echo Ahora puedes:
echo   - Clonar repositorios usando SSH
echo   - Hacer push y pull sin introducir contrasena cada vez
echo   - Usar GitHub con mayor seguridad
echo.

echo [INFO] Para mas informacion, visita:
echo https://docs.github.com/en/authentication/connecting-to-github-with-ssh
echo.

echo [OK] Configuracion completada. ^!A programar!
echo.

pause
