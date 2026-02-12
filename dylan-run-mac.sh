#!/bin/bash

# ========================================
# TiltGuard - Rama Dylan (macOS)
# Este script cambia a DylanBranch, hace pull, mata puertos e inicia todo
# Uso: ./dylan-run-mac.sh
# ========================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

print_ok() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ─────────────────────────────────────────────
# Función para liberar un puerto específico
# ─────────────────────────────────────────────
kill_port() {
    local PORT="$1"
    local PID=$(lsof -ti :${PORT} 2>/dev/null)

    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null
        echo -e "${YELLOW}[WARNING]${NC} Puerto $PORT liberado (PID: $PID)"
        sleep 1
    else
        echo -e "${BLUE}[INFO]${NC} No hay procesos en el puerto $PORT"
    fi
}

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}  TiltGuard - Rama Dylan (macOS)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ─────────────────────────────────────────────
# Git: Cambiar rama y pull
# ─────────────────────────────────────────────
cd "$PROJECT_DIR"

print_info "Cambiando a rama DylanBranch..."
git checkout DylanBranch
if [ $? -ne 0 ]; then
    print_error "Error al cambiar a rama DylanBranch"
    exit 1
fi
print_ok "Rama cambiada a DylanBranch"
echo ""

print_info "Haciendo pull de cambios..."
git pull origin DylanBranch
if [ $? -ne 0 ]; then
    print_error "Error al hacer pull"
    exit 1
fi
print_ok "Cambios descargados"
echo ""

# ─────────────────────────────────────────────
# Liberar puertos
# ─────────────────────────────────────────────
print_info "Liberando puertos 4200 y 5000..."
echo ""
kill_port 4200
kill_port 5000
echo ""

# ─────────────────────────────────────────────
# Verificaciones
# ─────────────────────────────────────────────
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}  Iniciando TiltGuard...${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Ejecuta './dylan-mac.sh' primero"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker no está corriendo. Abre Docker Desktop desde Aplicaciones"
    exit 1
fi

# Verificar Node
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Ejecuta './dylan-mac.sh' primero"
    exit 1
fi

# ─────────────────────────────────────────────
# MongoDB Docker
# ─────────────────────────────────────────────
echo ""
print_info "Iniciando MongoDB con Docker..."
cd "$PROJECT_DIR"
docker-compose up -d

if [ $? -eq 0 ]; then
    print_ok "MongoDB iniciado"
    sleep 3
else
    print_error "Error al iniciar MongoDB"
fi

# ─────────────────────────────────────────────
# Backend
# ─────────────────────────────────────────────
echo ""
print_info "Preparando backend..."
cd "$PROJECT_DIR/backend"

if [ ! -d "node_modules" ]; then
    print_info "Instalando dependencias del backend..."
    npm install
fi

if [ ! -f ".env" ]; then
    print_info "Creando archivo .env del backend..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    fi
fi

print_ok "Iniciando backend en puerto 5000..."
npm run dev &
BACKEND_PID=$!
sleep 2

# ─────────────────────────────────────────────
# Frontend
# ─────────────────────────────────────────────
echo ""
print_info "Preparando frontend..."
cd "$PROJECT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    print_info "Instalando dependencias del frontend..."
    npm install
fi

if [ ! -f ".env" ]; then
    print_info "Creando archivo .env del frontend..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    fi
fi

print_ok "Iniciando frontend en puerto 4200..."
npm start &
FRONTEND_PID=$!
sleep 2

# ─────────────────────────────────────────────
# Extensión
# ─────────────────────────────────────────────
echo ""
print_info "Extensión del navegador lista para desarrollo"
echo "  Para cargar la extensión:"
echo "  1. Abre chrome://extensions o edge://extensions"
echo "  2. Habilita 'Modo de desarrollador'"
echo "  3. Carga '$PROJECT_DIR/frontend/extension' como carpeta sin empaquetar"
echo ""

# ─────────────────────────────────────────────
# Resumen
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  TiltGuard iniciado en rama DylanBranch${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "URLs:"
echo "  - Frontend:      http://localhost:4200"
echo "  - Backend:       http://localhost:5000"
echo "  - MongoDB:       localhost:27017"
echo "  - Mongo Express: http://localhost:8081"
echo ""
echo "Presiona Ctrl+C para detener todo"

# ─────────────────────────────────────────────
# Capturar Ctrl+C para limpieza
# ─────────────────────────────────────────────
trap "
    echo ''
    echo 'Deteniendo servicios...'
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    cd '$PROJECT_DIR'
    docker-compose down
    echo 'Todo detenido correctamente'
    exit 0
" SIGINT

wait
