@echo off
REM TiltGuard Rama Dylan - Script para actualizar rama, matar puertos e iniciar proyecto
REM Este script se cambia a la rama DylanBranch, hace pull, mata puertos e inicia todo

setlocal enabledelayedexpansion

for /f %%i in ('cd') do set PROJECT_DIR=%%i

REM ─────────────────────────────────────────────
REM Funciones auxiliares
REM ─────────────────────────────────────────────

REM Funcion para liberar un puerto especifico
echo.
echo ========================================
echo TiltGuard - Rama Dylan
echo ========================================
echo.

REM Cambiar rama a DylanBranch y hacer pull
echo [Git] Cambiando a rama DylanBranch...
cd /d "%PROJECT_DIR%"

git checkout DylanBranch
if %errorlevel% neq 0 (
    echo [ERROR] Error al cambiar a rama DylanBranch
    pause
    exit /b 1
)

echo [OK] Rama cambiada a DylanBranch
echo.

echo [Git] Haciendo pull de cambios...
git pull origin DylanBranch
if %errorlevel% neq 0 (
    echo [ERROR] Error al hacer pull
    pause
    exit /b 1
)

echo [OK] Cambios descargados
echo.

REM Matar puertos
echo [Sistema] Liberando puertos 4200 y 5000...
echo.

REM Liberar puerto 4200
echo Buscando procesos en puerto 4200...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4200') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo [OK] Puerto 4200 liberado
echo.

REM Liberar puerto 5000
echo Buscando procesos en puerto 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo [OK] Puerto 5000 liberado
echo.

echo ========================================
echo [INFO] Iniciando TiltGuard...
echo ========================================
echo.

REM Verificar Docker
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado
    pause
    exit /b 1
)

REM Verificar Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    pause
    exit /b 1
)

REM MongoDB Docker
echo.
echo [Docker] Iniciando MongoDB...
cd /d "%PROJECT_DIR%"
call docker-compose up -d
if %errorlevel% equ 0 (
    echo [OK] MongoDB iniciado
    timeout /t 3 /nobreak
) else (
    echo [ERROR] Error al iniciar MongoDB
)

REM Backend
echo.
echo [Backend] Preparando backend...
cd /d "%PROJECT_DIR%\backend"

if not exist node_modules (
    echo [Backend] Instalando dependencias...
    call npm install
)

if not exist .env (
    echo [Backend] Creando archivo .env...
    if exist .env.example (
        copy .env.example .env
    )
)

echo [Backend] Iniciando en puerto 5000...
start cmd /k npm run dev
timeout /t 2 /nobreak

REM Frontend
echo.
echo [Frontend] Preparando frontend...
cd /d "%PROJECT_DIR%\frontend"

if not exist node_modules (
    echo [Frontend] Instalando dependencias...
    call npm install
)

if not exist .env (
    echo [Frontend] Creando archivo .env...
    if exist .env.example (
        copy .env.example .env
    )
)

echo [Frontend] Iniciando en puerto 4200...
start cmd /k npm start
timeout /t 2 /nobreak

REM Extension
echo.
echo [Extension] Preparando extension del navegador...
cd /d "%PROJECT_DIR%\frontend\extension"

if not exist node_modules (
    echo [Extension] Instalando dependencias...
    call npm install
)

echo [Extension] Extension lista para desarrollo
echo [Extension] Abre: chrome://extensions o edge://extensions
echo [Extension] Habilita "Modo de desarrollador"
echo [Extension] Carga "%PROJECT_DIR%\frontend\extension" como carpeta sin empaquetar
echo.

echo.
echo ========================================
echo TiltGuard iniciado en rama DylanBranch
echo ========================================
echo.
echo URLs:
echo - Frontend: http://localhost:4200
echo - Backend: http://localhost:5000
echo - Abrir la extension en: chrome://extensions
echo.
echo Presiona cualquier tecla para mantener esta ventana abierta
pause >nul
