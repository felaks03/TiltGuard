#!/bin/bash

# Script de Instalación de TiltGuard para macOS
# Este script instala y configura todo lo necesario para ejecutar el proyecto TiltGuard
# Uso: bash dylan.sh

set -e

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

# Funciones
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Verificar si está en macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "Este script está diseñado solo para macOS"
    exit 1
fi

print_header "Instalación de TiltGuard - macOS"
print_info "Este script instalará y configurará todas las dependencias de TiltGuard"

# 1. Verificar e instalar Homebrew
print_header "Paso 1: Verificando Homebrew"
if command -v brew &> /dev/null; then
    print_success "Homebrew ya está instalado"
else
    print_info "Instalando Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    print_success "Homebrew instalado correctamente"
fi

# 2. Verificar e instalar Node.js
print_header "Paso 2: Verificando Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js ya está instalado: $NODE_VERSION"
else
    print_info "Instalando Node.js..."
    brew install node
    print_success "Node.js instalado correctamente"
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm está disponible: versión $NPM_VERSION"
else
    print_error "Error al instalar npm"
    exit 1
fi

# 3. Verificar e instalar Docker
print_header "Paso 3: Verificando Docker"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker ya está instalado: $DOCKER_VERSION"
else
    print_info "Instalando Docker Desktop para macOS via Homebrew..."
    brew install --cask docker
    print_info "Lanzando Docker Desktop..."
    open /Applications/Docker.app
    print_warning "Esperando a que Docker inicie (puede tomar 30-60 segundos)..."
    
    # Esperar a que el daemon de Docker esté listo
    max_attempts=60
    attempt=0
    while ! docker info &> /dev/null; do
        attempt=$((attempt + 1))
        if [ $attempt -gt $max_attempts ]; then
            print_error "Docker no pudo iniciar. Por favor verifica tu instalación de Docker."
            exit 1
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    print_success "Docker ahora está funcionando"
fi

# 4. Verificar Docker Compose
print_header "Paso 4: Verificando Docker Compose"
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    print_success "Docker Compose está disponible: $COMPOSE_VERSION"
else
    print_error "Docker Compose no encontrado. Debería incluirse con Docker Desktop."
    print_warning "Por favor asegúrate de que Docker Desktop está correctamente instalado"
    exit 1
fi

# 5. Instalar dependencias del backend
print_header "Paso 5: Instalando Dependencias del Backend"
if [ -d "backend" ]; then
    cd backend
    if [ -f "package.json" ]; then
        print_info "Instalando paquetes npm para el backend..."
        npm install
        print_success "Dependencias del backend instaladas"
    else
        print_error "package.json no encontrado en el directorio backend"
        exit 1
    fi
    cd ..
else
    print_error "Directorio backend no encontrado"
    exit 1
fi

# 6. Instalar dependencias del frontend
print_header "Paso 6: Instalando Dependencias del Frontend"
if [ -d "frontend" ]; then
    cd frontend
    if [ -f "package.json" ]; then
        print_info "Instalando paquetes npm para el frontend..."
        npm install
        print_success "Dependencias del frontend instaladas"
    else
        print_error "package.json no encontrado en el directorio frontend"
        exit 1
    fi
    cd ..
else
    print_error "Directorio frontend no encontrado"
    exit 1
fi

# 7. Configurar variables de entorno
print_header "Paso 7: Configurando Variables de Entorno"

if [ -f "backend/.env" ]; then
    print_info "Backend .env ya existe"
else
    if [ -f "backend/.env.example" ]; then
        print_info "Creando .env desde .env.example para el backend..."
        cp backend/.env.example backend/.env
        print_success "Backend .env creado"
    else
        print_warning "No se encontró .env.example en backend, creando .env por defecto..."
        cat > backend/.env << EOF
MONGODB_URI=mongodb://admin:password123@localhost:27017/tiltguard?authSource=admin
PORT=5000
NODE_ENV=development
EOF
        print_success "Backend .env por defecto creado"
    fi
fi

# 8. Iniciar contenedores Docker (MongoDB)
print_header "Paso 8: Iniciando MongoDB con Docker"
if [ -f "docker-compose.yml" ]; then
    print_info "Iniciando servicios Docker..."
    docker compose up -d
    print_success "Servicios Docker iniciados"
    print_info "Esperando a que MongoDB esté listo..."
    sleep 10
else
    print_error "docker-compose.yml no encontrado"
    exit 1
fi

# 9. Inyectar usuarios en la base de datos
print_header "Paso 9: Inyectando Usuarios en la Base de Datos"
if [ -d "backend" ]; then
    cd backend
    print_info "Ejecutando seed de usuarios..."
    npm run seed
    print_success "Usuarios inyectados correctamente"
    cd ..
else
    print_error "Directorio backend no encontrado"
    exit 1
fi

# 10. Ejecutar el proyecto
print_header "Instalación Completada"
print_success "Todas las dependencias se han instalado correctamente"
print_success "Iniciando proyecto TiltGuard..."

echo ""

if [ -f "run.sh" ]; then
    bash run.sh
else
    print_error "run.sh no encontrado en la raíz del proyecto"
    exit 1
fi
