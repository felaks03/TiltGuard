#!/bin/bash

# TiltGuard - Script para iniciar todo (MongoDB Docker + Backend + Frontend)

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
        echo -e "${YELLOW}⚠️  Puerto $PORT liberado${NC}"
        sleep 1
        return 0
    else
        echo -e "${BLUE}ℹ️  No había procesos en el puerto $PORT${NC}"
        return 1
    fi
}

# ─────────────────────────────────────────────
# Función para mostrar menú
# ─────────────────────────────────────────────
show_menu() {
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${BLUE}TiltGuard - Gestor de Servicios${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo "1) Matar puertos 4200 y 4000"
    echo "2) Iniciar proyecto (Frontend + Backend + MongoDB)"
    echo "0) Salir"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    read -p "Selecciona una opción: " OPTION
}

# ─────────────────────────────────────────────
# Iniciar proyecto completo
# ─────────────────────────────────────────────
start_project() {

    echo -e "${GREEN}🚀 Iniciando TiltGuard...${NC}"
    echo "=========================="

    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        exit 1
    fi

    # Verificar Node
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        exit 1
    fi

    # Liberar puertos antes de arrancar
    echo -e "${BLUE}[Sistema]${NC} Liberando puertos necesarios..."
    kill_port 4200
    kill_port 4000

    # ───── MongoDB Docker ─────
    echo ""
    echo -e "${BLUE}[Docker]${NC} Iniciando MongoDB..."
    cd "$PROJECT_DIR"
    docker-compose up -d

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ MongoDB iniciado${NC}"
        sleep 3
    else
        echo -e "${RED}❌ Error al iniciar MongoDB${NC}"
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

    echo -e "${GREEN}[Backend]${NC} Iniciando en puerto 4000..."
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
    echo "Backend:  http://localhost:4000"
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
# Matar puertos manualmente
# ─────────────────────────────────────────────
kill_ports() {
    echo -e "${YELLOW}Liberando puertos 4200 y 4000...${NC}"
    echo ""
    kill_port 4200
    kill_port 4000
    echo ""
    echo -e "${GREEN}✓ Puertos liberados${NC}"
}

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if [ $# -eq 0 ]; then
    while true; do
        show_menu
        case $OPTION in
            1)
                echo ""
                kill_ports
                break
                ;;
            2)
                echo ""
                start_project
                break
                ;;
            0)
                echo "Saliendo..."
                exit 0
                ;;
            *)
                echo -e "${RED}Opción inválida${NC}"
                echo ""
                ;;
        esac
    done
else
    case $1 in
        start)
            start_project
            ;;
        kill)
            kill_ports
            ;;
        *)
            echo "Uso: ./run.sh [start|kill]"
            exit 1
            ;;
    esac
fi
