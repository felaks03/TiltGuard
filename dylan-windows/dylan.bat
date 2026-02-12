@echo off
REM Script de Instalacion de TiltGuard para Windows
REM Este script instala y configura todo lo necesario para ejecutar el proyecto TiltGuard
REM Uso: dylan.bat

setlocal enabledelayedexpansion

REM Verificar si se ejecuta como administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Este script requiere permisos de administrador
    echo Por favor, ejecuta el script como administrador
    pause
    exit /b 1
)

cls
echo.
echo ========================================
echo Instalacion de TiltGuard - Windows
echo ========================================
echo.
echo [INFO] Este script instalara y configurara todas las dependencias de TiltGuard
echo.

REM 0. Instalar Chocolatey si no existe
echo.
echo ========================================
echo Paso 0: Verificando Chocolatey
echo ========================================
where choco >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Chocolatey no esta instalado. Instalando...
    powershell -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "& {[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))}" && SET "PATH=%PATH%;%PROGRAMDATA%\chocolatey\bin"
    if %errorlevel% equ 0 (
        echo [OK] Chocolatey instalado correctamente
    ) else (
        echo [ERROR] Error al instalar Chocolatey
        echo Por favor, instala Chocolatey manualmente desde: https://chocolatey.org/install
        pause
        exit /b 1
    )
) else (
    echo [OK] Chocolatey ya esta instalado
)

REM 1. Verificar e instalar Node.js
echo.
echo ========================================
echo Paso 1: Instalando Node.js
echo ========================================
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [OK] Node.js ya esta instalado: !NODE_VERSION!
) else (
    echo [INFO] Instalando Node.js...
    choco install nodejs -y
    if %errorlevel% equ 0 (
        echo [OK] Node.js instalado correctamente
        REM Refrescar PATH
        call RefreshEnv.cmd
    ) else (
        echo [ERROR] Error al instalar Node.js
        pause
        exit /b 1
    )
)

REM Verificar npm
where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo [OK] npm esta disponible: version !NPM_VERSION!
) else (
    echo [ERROR] Error al verificar npm
    pause
    exit /b 1
)

REM 2. Verificar e instalar Docker
echo.
echo ========================================
echo Paso 2: Instalando Docker Desktop
echo ========================================
where docker >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo [OK] Docker ya esta instalado: !DOCKER_VERSION!
) else (
    echo [INFO] Instalando Docker Desktop...
    choco install docker-desktop -y
    if %errorlevel% equ 0 (
        echo [OK] Docker Desktop instalado correctamente
        echo [WARNING] Reinicia tu computadora para que Docker funcione correctamente
        echo Presiona cualquier tecla despues de reiniciar y ejecuta este script nuevamente
        pause
        exit /b 0
    ) else (
        echo [ERROR] Error al instalar Docker Desktop
        pause
        exit /b 1
    )
)

REM 3. Verificar Git
echo.
echo ========================================
echo Paso 3: Instalando Git
echo ========================================
where git >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo [OK] Git esta instalado: !GIT_VERSION!
) else (
    echo [INFO] Instalando Git...
    choco install git -y
    if %errorlevel% equ 0 (
        echo [OK] Git instalado correctamente
        call RefreshEnv.cmd
    ) else (
        echo [ERROR] Error al instalar Git
        pause
        exit /b 1
    )
)

REM 4. Instalar dependencias del Backend
echo.
echo ========================================
echo Paso 4: Instalando dependencias del Backend
echo ========================================
if exist backend\node_modules (
    echo [OK] Backend ya tiene dependencias instaladas
) else (
    echo [INFO] Instalando dependencias del backend...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Error al instalar dependencias del backend
        pause
        exit /b 1
    )
    echo [OK] Dependencias del backend instaladas
    cd ..
)

REM 5. Instalar dependencias del Frontend
echo.
echo ========================================
echo Paso 5: Instalando dependencias del Frontend
echo ========================================
if exist frontend\node_modules (
    echo [OK] Frontend ya tiene dependencias instaladas
) else (
    echo [INFO] Instalando dependencias del frontend...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Error al instalar dependencias del frontend
        pause
        exit /b 1
    )
    echo [OK] Dependencias del frontend instaladas
    cd ..
)

REM 6. Verificar archivos .env
echo.
echo ========================================
echo Paso 6: Verificando archivos de configuracion
echo ========================================
if exist backend\.env (
    echo [OK] Archivo .env del backend existe
) else (
    echo [INFO] Creando .env del backend...
    if exist backend\.env.example (
        copy backend\.env.example backend\.env
        echo [OK] .env creado desde .env.example
    ) else (
        echo [WARNING] No se encontro .env.example en backend
    )
)

if exist frontend\.env (
    echo [OK] Archivo .env del frontend existe
) else (
    echo [INFO] Creando .env del frontend...
    if exist frontend\.env.example (
        copy frontend\.env.example frontend\.env
        echo [OK] .env creado desde .env.example
    ) else (
        echo [WARNING] No se encontro .env.example en frontend
    )
)

REM 7. Mensaje final
echo.
echo ========================================
echo Instalacion completada exitosamente
echo ========================================
echo.
echo Proximos pasos:
echo 1. Ejecuta 'run.bat' para iniciar el proyecto
echo 2. Para la rama Dylan: usa 'dylan-run.bat'
echo.
pause
