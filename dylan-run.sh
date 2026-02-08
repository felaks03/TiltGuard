#!/bin/bash

# TiltGuard Rama Dylan - Script para actualizar rama, matar puertos e iniciar proyecto
# Este script se cambia a la rama DylanBranch, hace pull, mata puertos e inicia todo

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# ─────────────────────────────────────────────
# Función para liberar un puerto específico
# ─────────────────────────────────────────────
kill_port() {
    local PORT="$1"

    if sudo fuser -k ${PORT}/tcp >/dev/null 2>&1; then
        echo -e "${YELLOW}Puerto $PORT liberado${NC}"
        sleep 1
        return 0
    else
        echo -e "${BLUE}No había procesos en el puerto $PORT${NC}"
        return 1
    fi
}

# ─────────────────────────────────────────────
# Cambiar rama a DylanBranch y hacer pull
# ─────────────────────────────────────────────
update_branch() {
    echo -e "${BLUE}[Git]${NC} Cambiando a rama DylanBranch..."
    cd "$PROJECT_DIR"
    
    git checkout DylanBranch
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error al cambiar a rama DylanBranch${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Rama cambiada a DylanBranch${NC}"
    
    echo -e "${BLUE}[Git]${NC} Haciendo pull de cambios..."
    git pull origin DylanBranch
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error al hacer pull${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Cambios descargados${NC}"
}

# ─────────────────────────────────────────────
# Matar puertos
# ─────────────────────────────────────────────
kill_ports() {
    echo -e "${YELLOW}Liberando puertos 4200 y 5000...${NC}"
    echo ""
    kill_port 4200
    kill_port 5000
    echo ""
    echo -e "${GREEN}✓ Puertos liberados${NC}"
}

# ─────────────────────────────────────────────
# Iniciar proyecto completo
# ─────────────────────────────────────────────
start_project() {

    echo -e "${GREEN}Iniciando TiltGuard...${NC}"
    echo "=========================="

    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker no está instalado${NC}"
        exit 1
    fi

    # Verificar Node
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js no está instalado${NC}"
        exit 1
    fi

    # ───── MongoDB Docker ─────
    echo ""
    echo -e "${BLUE}[Docker]${NC} Iniciando MongoDB..."
    cd "$PROJECT_DIR"
    docker compose up -d

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ MongoDB iniciado${NC}"
        sleep 3
    else
        echo -e "${RED}Error al iniciar MongoDB${NC}"
    fi

    # ───── Backend ─────
    echo ""
    echo -e "${BLUE}[Backend]${NC} Preparando backend..."
    cd "$PROJECT_DIR/backend"

    if [ ! -d "node_modules" ]; then
        npm install
    fi

    if [ ! -f ".env" ]; then
        cp .env.example .env
    fi

    echo -e "${GREEN}[Backend]${NC} Iniciando en puerto 5000..."
    npm run dev &
    BACKEND_PID=$!

    # ───── Frontend ─────
    echo ""
    echo -e "${BLUE}[Frontend]${NC} Preparando frontend..."
    cd "$PROJECT_DIR/frontend"

    if [ ! -d "node_modules" ]; then
        npm install
    fi

    echo -e "${GREEN}[Frontend]${NC} Iniciando en puerto 4200..."
    npm start &
    FRONTEND_PID=$!

    # ───── Resumen ─────
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Servicios iniciados:${NC}"
    echo "Frontend: http://localhost:4200"
    echo "Backend:  http://localhost:5000"
    echo "MongoDB:  localhost:27017"
    echo "Mongo Express: http://localhost:8081"
    echo -e "${GREEN}════════════════════════════════════════════════${NC}"
    echo ""
    echo "Presiona Ctrl+C para detener todo"

    # ───── Capturar Ctrl+C ─────
    trap "
        echo ''
        echo 'Deteniendo servicios...'
        kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
        cd '$PROJECT_DIR'
        docker-compose down
        echo '✓ Todo detenido correctamente'
        exit 0
    " SIGINT

    wait
}

# ─────────────────────────────────────────────
# MAIN - Flujo automático
# ─────────────────────────────────────────────

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${BLUE}TiltGuard - Rama Dylan${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""

# Paso 1: Actualizar rama
update_branch

# Paso 2: Matar puertos
echo ""
kill_ports

# Paso 3: Iniciar proyecto
echo ""
start_project
