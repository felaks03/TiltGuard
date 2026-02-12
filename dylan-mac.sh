#!/bin/bash

# ========================================
# Script de Instalación de TiltGuard para macOS
# Este script instala y configura todo lo necesario para ejecutar el proyecto TiltGuard
# Uso: ./dylan-mac.sh
# ========================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Función para imprimir secciones
print_section() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

print_ok() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}  Instalación de TiltGuard - macOS${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
print_info "Este script instalará y configurará todas las dependencias de TiltGuard"
echo ""

# ─────────────────────────────────────────────
# Paso 0: Instalar Homebrew si no existe
# ─────────────────────────────────────────────
print_section "Paso 0: Verificando Homebrew"

if command -v brew &> /dev/null; then
    print_ok "Homebrew ya está instalado: $(brew --version | head -n1)"
else
    print_info "Homebrew no está instalado. Instalando..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    if [ $? -eq 0 ]; then
        print_ok "Homebrew instalado correctamente"

        # Añadir Homebrew al PATH según la arquitectura del Mac
        if [[ $(uname -m) == "arm64" ]]; then
            # Apple Silicon (M1/M2/M3/M4)
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
            eval "$(/opt/homebrew/bin/brew shellenv)"
        else
            # Intel Mac
            echo 'eval "$(/usr/local/bin/brew shellenv)"' >> "$HOME/.zprofile"
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        print_info "Homebrew añadido al PATH"
    else
        print_error "Error al instalar Homebrew"
        echo "Instálalo manualmente desde: https://brew.sh/"
        exit 1
    fi
fi

# ─────────────────────────────────────────────
# Paso 1: Instalar Node.js
# ─────────────────────────────────────────────
print_section "Paso 1: Instalando Node.js"

if command -v node &> /dev/null; then
    print_ok "Node.js ya está instalado: $(node -v)"
else
    print_info "Instalando Node.js..."
    brew install node

    if [ $? -eq 0 ]; then
        print_ok "Node.js instalado correctamente: $(node -v)"
    else
        print_error "Error al instalar Node.js"
        exit 1
    fi
fi

# Verificar npm
if command -v npm &> /dev/null; then
    print_ok "npm está disponible: versión $(npm -v)"
else
    print_error "npm no está disponible después de instalar Node.js"
    exit 1
fi

# ─────────────────────────────────────────────
# Paso 2: Instalar Docker
# ─────────────────────────────────────────────
print_section "Paso 2: Instalando Docker Desktop"

if command -v docker &> /dev/null; then
    print_ok "Docker ya está instalado: $(docker --version)"
else
    print_info "Instalando Docker Desktop..."
    brew install --cask docker

    if [ $? -eq 0 ]; then
        print_ok "Docker Desktop instalado correctamente"
        print_warning "Abre Docker Desktop desde Aplicaciones y espera a que arranque"
        print_warning "Después de abrir Docker, vuelve a ejecutar este script"
        echo ""
        read -p "¿Ya tienes Docker Desktop abierto y corriendo? (S/N): " docker_ready
        if [[ ! "$docker_ready" =~ ^[Ss]$ ]]; then
            print_info "Abre Docker Desktop y ejecuta este script de nuevo cuando esté listo"
            exit 0
        fi
    else
        print_error "Error al instalar Docker Desktop"
        echo "Descárgalo manualmente desde: https://www.docker.com/products/docker-desktop/"
        exit 1
    fi
fi

# Verificar que Docker está corriendo
if docker info &> /dev/null; then
    print_ok "Docker está corriendo"
else
    print_warning "Docker no está corriendo. Abre Docker Desktop desde Aplicaciones"
    print_info "Espera a que Docker arranque completamente y ejecuta este script de nuevo"
    exit 1
fi

# ─────────────────────────────────────────────
# Paso 3: Instalar Git
# ─────────────────────────────────────────────
print_section "Paso 3: Verificando Git"

if command -v git &> /dev/null; then
    print_ok "Git está instalado: $(git --version)"
else
    print_info "Instalando Git..."
    brew install git

    if [ $? -eq 0 ]; then
        print_ok "Git instalado correctamente"
    else
        print_error "Error al instalar Git"
        exit 1
    fi
fi

# ─────────────────────────────────────────────
# Paso 4: Instalar Angular CLI (global)
# ─────────────────────────────────────────────
print_section "Paso 4: Instalando Angular CLI"

if command -v ng &> /dev/null; then
    print_ok "Angular CLI ya está instalado: $(ng version 2>/dev/null | grep 'Angular CLI' || echo 'disponible')"
else
    print_info "Instalando Angular CLI globalmente..."
    npm install -g @angular/cli

    if [ $? -eq 0 ]; then
        print_ok "Angular CLI instalado correctamente"
    else
        print_warning "Error al instalar Angular CLI globalmente. Se usará la versión local del proyecto"
    fi
fi

# ─────────────────────────────────────────────
# Paso 5: Instalar dependencias del Backend
# ─────────────────────────────────────────────
print_section "Paso 5: Instalando dependencias del Backend"

if [ -d "$PROJECT_DIR/backend/node_modules" ]; then
    print_ok "Backend ya tiene dependencias instaladas"
else
    print_info "Instalando dependencias del backend..."
    cd "$PROJECT_DIR/backend"
    npm install

    if [ $? -ne 0 ]; then
        print_error "Error al instalar dependencias del backend"
        exit 1
    fi
    print_ok "Dependencias del backend instaladas"
    cd "$PROJECT_DIR"
fi

# ─────────────────────────────────────────────
# Paso 6: Instalar dependencias del Frontend
# ─────────────────────────────────────────────
print_section "Paso 6: Instalando dependencias del Frontend"

if [ -d "$PROJECT_DIR/frontend/node_modules" ]; then
    print_ok "Frontend ya tiene dependencias instaladas"
else
    print_info "Instalando dependencias del frontend..."
    cd "$PROJECT_DIR/frontend"
    npm install

    if [ $? -ne 0 ]; then
        print_error "Error al instalar dependencias del frontend"
        exit 1
    fi
    print_ok "Dependencias del frontend instaladas"
    cd "$PROJECT_DIR"
fi

# ─────────────────────────────────────────────
# Paso 7: Verificar archivos .env
# ─────────────────────────────────────────────
print_section "Paso 7: Verificando archivos de configuración"

if [ -f "$PROJECT_DIR/backend/.env" ]; then
    print_ok "Archivo .env del backend existe"
else
    print_info "Creando .env del backend..."
    if [ -f "$PROJECT_DIR/backend/.env.example" ]; then
        cp "$PROJECT_DIR/backend/.env.example" "$PROJECT_DIR/backend/.env"
        print_ok ".env creado desde .env.example"
    else
        print_warning "No se encontró .env.example en backend"
    fi
fi

if [ -f "$PROJECT_DIR/frontend/.env" ]; then
    print_ok "Archivo .env del frontend existe"
else
    print_info "Creando .env del frontend..."
    if [ -f "$PROJECT_DIR/frontend/.env.example" ]; then
        cp "$PROJECT_DIR/frontend/.env.example" "$PROJECT_DIR/frontend/.env"
        print_ok ".env creado desde .env.example"
    else
        print_warning "No se encontró .env.example en frontend"
    fi
fi

# ─────────────────────────────────────────────
# Paso 8: Dar permisos de ejecución a scripts
# ─────────────────────────────────────────────
print_section "Paso 8: Configurando permisos de scripts"

chmod +x "$PROJECT_DIR/dylan-mac.sh" 2>/dev/null
chmod +x "$PROJECT_DIR/dylan-run-mac.sh" 2>/dev/null
chmod +x "$PROJECT_DIR/setup-ssh-mac.sh" 2>/dev/null
chmod +x "$PROJECT_DIR/run.sh" 2>/dev/null

print_ok "Permisos de ejecución configurados"

# ─────────────────────────────────────────────
# Mensaje final
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Instalación completada exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Próximos pasos:"
echo "  1. Ejecuta './dylan-run-mac.sh' para iniciar el proyecto en la rama Dylan"
echo "  2. O ejecuta './run.sh' para iniciar normalmente"
echo "  3. Para configurar SSH: './setup-ssh-mac.sh'"
echo ""
echo "URLs disponibles después de iniciar:"
echo "  - Frontend:      http://localhost:4200"
echo "  - Backend API:   http://localhost:5000"
echo "  - Mongo Express: http://localhost:8081"
echo ""
