#!/bin/bash

# TiltGuard - Script para iniciar todo (MongoDB Docker + Backend + Frontend)

echo "🚀 Iniciando TiltGuard..."
echo "=========================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instálalo primero."
    exit 1
fi

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instálalo primero."
    exit 1
fi

# Iniciar MongoDB con Docker
echo -e "${BLUE}[Docker]${NC} Iniciando MongoDB..."
cd "$PROJECT_DIR"
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MongoDB iniciado${NC}"
    sleep 3
else
    echo -e "${YELLOW}⚠️  Error al iniciar MongoDB${NC}"
fi

# Iniciar Backend
echo ""
echo -e "${BLUE}[Backend]${NC} Instalando dependencias..."
cd "$PROJECT_DIR/backend"

if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi

if [ ! -f ".env" ]; then
    echo -e "${BLUE}[Backend]${NC} Creando archivo .env..."
    cp .env.example .env
fi

echo -e "${GREEN}[Backend]${NC} Iniciando servidor en puerto 5000..."
npm run dev &
BACKEND_PID=$!

# Iniciar Frontend
echo ""
echo -e "${BLUE}[Frontend]${NC} Instalando dependencias..."
cd "$PROJECT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi

echo -e "${GREEN}[Frontend]${NC} Iniciando servidor en puerto 4200..."
npm start &
FRONTEND_PID=$!

# Resumen
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Todos los servidores iniciados:${NC}"
echo -e "  Frontend (Angular):  http://localhost:4200"
echo -e "  Backend (Express):   http://localhost:5000"
echo -e "  MongoDB:             localhost:27017"
echo -e "  Mongo Express GUI:   http://localhost:8081"
echo ""
echo -e "${YELLOW}Credenciales MongoDB:${NC}"
echo -e "  Usuario: admin"
echo -e "  Contraseña: password123"
echo ""
echo "Presiona Ctrl+C para detener todo"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

# Capturar Ctrl+C
trap "
echo ''
echo 'Deteniendo todos los servidores...'
kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
echo 'Deteniendo contenedores Docker...'
cd '$PROJECT_DIR'
docker-compose down
echo '✓ Todo detenido'
exit 0
" SIGINT

# Esperar
wait
