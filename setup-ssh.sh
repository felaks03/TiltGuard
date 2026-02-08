#!/bin/bash

# Script de Configuración de SSH para GitHub
# Este script te guía paso a paso para configurar la autenticación SSH con GitHub
# Uso: bash setup-ssh.sh

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin color

# Funciones
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
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

print_step() {
    echo -e "${CYAN}→ $1${NC}"
}

pause_for_user() {
    echo ""
    read -p "Presiona Enter para continuar..."
}

# Script principal
print_header "Configuración de SSH para GitHub"
print_info "Este script te ayudará a configurar la autenticación SSH con GitHub"

# Paso 1: Verificar si ya existe clave SSH
print_header "Paso 1: Verificando claves SSH existentes"

SSH_DIR="$HOME/.ssh"
SSH_KEY="$SSH_DIR/id_ed25519"
SSH_KEY_PUB="$SSH_KEY.pub"

if [ -f "$SSH_KEY" ]; then
    print_success "Clave SSH ya existe en $SSH_KEY"
else
    print_warning "No se encontró clave SSH, creando una..."
    
    # Crear directorio .ssh si no existe
    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"
    
    # Pedir email
    print_info "Por favor introduce tu correo de GitHub:"
    read -p "Correo: " github_email
    
    if [ -z "$github_email" ]; then
        print_error "El correo no puede estar vacío"
        exit 1
    fi
    
    # Generar clave SSH (sin interacción, sin contraseña para facilitar)
    print_info "Generando clave SSH (usando algoritmo Ed25519)..."
    ssh-keygen -t ed25519 -C "$github_email" -f "$SSH_KEY" -N ""
    
    if [ -f "$SSH_KEY" ]; then
        print_success "Clave SSH generada correctamente"
        chmod 600 "$SSH_KEY"
        chmod 644 "$SSH_KEY_PUB"
    else
        print_error "Error al generar la clave SSH"
        exit 1
    fi
fi

# Paso 2: Iniciar SSH agent y añadir clave
print_header "Paso 2: Iniciando SSH agent y añadiendo clave"

# Iniciar SSH agent
eval "$(ssh-agent -s)" > /dev/null

# Añadir clave SSH al agent
ssh-add "$SSH_KEY" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "Clave SSH añadida al agent"
else
    print_warning "No se pudo añadir la clave al agent, pero seguirá funcionando"
fi

# Paso 3: Mostrar clave pública
print_header "Paso 3: Tu Clave Pública SSH"

print_info "Aquí está tu clave pública SSH (cópiala a GitHub):"
echo ""
echo -e "${CYAN}========================================${NC}"
cat "$SSH_KEY_PUB"
echo -e "${CYAN}========================================${NC}"
echo ""

# Copiar al portapapeles si pbcopy está disponible (macOS)
if command -v pbcopy &> /dev/null; then
    cat "$SSH_KEY_PUB" | pbcopy
    print_success "Clave pública copiada al portapapeles"
else
    print_info "Por favor copia la clave de arriba manualmente"
fi

# Paso 4: Guía para añadir clave a GitHub
print_header "Paso 4: Añadiendo Clave SSH a GitHub"

print_step "Abre tu navegador y ve a: https://github.com/settings/keys"
print_step "Haz clic en el botón 'New SSH key'"
print_step "Dale un título (p.ej., 'Mi Mac')"
print_step "Pega la clave SSH (copiada al portapapeles) en el campo 'Key'"
print_step "Haz clic en 'Add SSH key'"

pause_for_user

# Paso 5: Verificar conexión SSH
print_header "Paso 5: Verificando Conexión SSH"

print_info "Probando conexión a GitHub..."
ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"

if [ $? -eq 0 ]; then
    print_success "Conexión SSH a GitHub verificada correctamente"
else
    # Intentar de nuevo con más información
    echo ""
    print_info "Conectando a GitHub..."
    ssh -T git@github.com
fi

# Paso 6: Configurar Git (opcional)
print_header "Paso 6: Configurar Git"

print_info "Verificando configuración de Git..."

git_user=$(git config --global user.name 2>/dev/null)
git_email=$(git config --global user.email 2>/dev/null)

if [ -z "$git_user" ] || [ -z "$git_email" ]; then
    print_warning "Usuario o email de Git no configurados globalmente"
    echo ""
    print_step "Introduce tu nombre de usuario de Git (tu nombre de usuario de GitHub):"
    read -p "Nombre de usuario: " git_username
    
    print_step "Introduce tu correo de Git (tu correo de GitHub):"
    read -p "Correo: " git_email_config
    
    if [ -n "$git_username" ] && [ -n "$git_email_config" ]; then
        git config --global user.name "$git_username"
        git config --global user.email "$git_email_config"
        print_success "Git configurado globalmente"
    fi
else
    print_success "Git ya está configurado:"
    print_info "  Usuario: $git_user"
    print_info "  Correo: $git_email"
fi

# Paso 7: Probar con git clone
print_header "Paso 7: Probando con Git"

print_info "Ahora puedes clonar repositorios usando SSH:"
echo -e "${CYAN}  git clone git@github.com:usuario/repositorio.git${NC}"
echo ""

# Resumen final
print_header "Configuración Completada"

print_success "Clave SSH ahora está configurada para GitHub"
echo ""
echo -e "${GREEN}Ahora puedes:${NC}"
echo "  • Clonar repositorios usando SSH"
echo "  • Hacer push y pull sin introducir contraseña cada vez"
echo "  • Usar GitHub con mayor seguridad"
echo ""

print_info "Para más información, visita: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
echo ""
print_success "Configuración completada. ¡A programar!"
