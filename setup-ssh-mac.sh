#!/bin/bash

# ========================================
# Script de Configuración de SSH para GitHub en macOS
# Este script genera claves SSH, las configura y te guía para añadirlas a GitHub
# Uso: ./setup-ssh-mac.sh
# ========================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}  Configuración de SSH para GitHub${NC}"
echo -e "${BLUE}  macOS${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
print_info "Este script te ayudará a configurar la autenticación SSH con GitHub"
echo ""

# ─────────────────────────────────────────────
# Verificar Git
# ─────────────────────────────────────────────
if ! command -v git &> /dev/null; then
    print_error "Git no está instalado"
    echo "Ejecuta './dylan-mac.sh' primero para instalar Git, o instálalo con:"
    echo "  brew install git"
    exit 1
fi

# ─────────────────────────────────────────────
# Paso 1: Verificar claves SSH existentes
# ─────────────────────────────────────────────
print_section "Paso 1: Verificando claves SSH existentes"

SSH_DIR="$HOME/.ssh"
SSH_KEY="$SSH_DIR/id_ed25519"
SSH_KEY_PUB="$SSH_KEY.pub"

if [ -f "$SSH_KEY" ]; then
    print_ok "Clave SSH ya existe en $SSH_KEY"
    echo ""
    read -p "¿Deseas generar una nueva clave? (S/N): " regenerate
    if [[ "$regenerate" =~ ^[Ss]$ ]]; then
        rm -f "$SSH_KEY" "$SSH_KEY_PUB"
        print_info "Clave anterior eliminada"
    else
        echo ""
        print_info "Usando clave existente. Saltando a paso 2..."
    fi
fi

if [ ! -f "$SSH_KEY" ]; then
    print_info "Creando nueva clave SSH..."
    echo ""

    # Crear directorio .ssh si no existe
    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"

    # Pedir email
    read -p "Introduce tu correo de GitHub: " github_email

    if [ -z "$github_email" ]; then
        print_error "El correo no puede estar vacío"
        exit 1
    fi

    # Generar clave SSH
    ssh-keygen -t ed25519 -C "$github_email" -f "$SSH_KEY" -N ""

    if [ $? -eq 0 ]; then
        print_ok "Clave SSH generada correctamente"
    else
        print_error "Error al generar la clave SSH"
        exit 1
    fi
fi

# ─────────────────────────────────────────────
# Paso 2: Configurar SSH Agent
# ─────────────────────────────────────────────
print_section "Paso 2: Configurando SSH Agent"

# Iniciar ssh-agent
eval "$(ssh-agent -s)"
print_ok "SSH agent iniciado"

# Crear/actualizar config de SSH para que use Keychain en macOS
SSH_CONFIG="$SSH_DIR/config"

if [ ! -f "$SSH_CONFIG" ] || ! grep -q "github.com" "$SSH_CONFIG" 2>/dev/null; then
    print_info "Configurando SSH para GitHub con Keychain de macOS..."

    cat >> "$SSH_CONFIG" << EOF

# GitHub SSH config (añadido por setup-ssh-mac.sh)
Host github.com
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519
EOF

    chmod 600 "$SSH_CONFIG"
    print_ok "Configuración SSH creada"
else
    print_ok "Configuración SSH para GitHub ya existe"
fi

# Añadir clave al ssh-agent con Keychain
ssh-add --apple-use-keychain "$SSH_KEY" 2>/dev/null || ssh-add -K "$SSH_KEY" 2>/dev/null || ssh-add "$SSH_KEY" 2>/dev/null

if [ $? -eq 0 ]; then
    print_ok "Clave añadida al SSH agent y al Keychain de macOS"
else
    print_warning "No se pudo añadir la clave al Keychain, pero se añadió al agent"
fi

# ─────────────────────────────────────────────
# Paso 3: Mostrar clave pública
# ─────────────────────────────────────────────
print_section "Paso 3: Tu Clave Pública SSH"

print_info "Aquí está tu clave pública SSH (cópiala a GitHub):"
echo ""
echo -e "${GREEN}========================================${NC}"

if [ -f "$SSH_KEY_PUB" ]; then
    cat "$SSH_KEY_PUB"
else
    print_error "No se encontró la clave pública"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo ""

# Copiar clave al portapapeles
if command -v pbcopy &> /dev/null; then
    cat "$SSH_KEY_PUB" | pbcopy
    print_ok "Clave copiada al portapapeles (puedes pegar con Cmd+V)"
else
    print_warning "No se pudo copiar al portapapeles. Copia la clave manualmente"
fi

# ─────────────────────────────────────────────
# Paso 4: Guía para añadir clave a GitHub
# ─────────────────────────────────────────────
print_section "Paso 4: Añadiendo Clave SSH a GitHub"

echo "PASOS A SEGUIR:"
echo ""
echo "  1. Abre tu navegador web"
echo "  2. Ve a: https://github.com/settings/keys"
echo "  3. Haz clic en el botón 'New SSH key' (parte superior derecha)"
echo "  4. Dale un título a la clave (p.ej., 'Mi Mac')"
echo "  5. Selecciona 'Authentication Key' como tipo"
echo "  6. Pega la clave SSH en el campo 'Key' (Cmd+V)"
echo "  7. Haz clic en 'Add SSH key'"
echo ""

# Abrir la página de GitHub automáticamente
read -p "¿Quieres abrir GitHub Settings en el navegador? (S/N): " open_browser
if [[ "$open_browser" =~ ^[Ss]$ ]]; then
    open "https://github.com/settings/keys"
    print_ok "Página de GitHub abierta en el navegador"
fi

echo ""
read -p "Presiona Enter una vez que hayas añadido la clave a GitHub..."

# ─────────────────────────────────────────────
# Paso 5: Verificar conexión SSH
# ─────────────────────────────────────────────
print_section "Paso 5: Verificando Conexión SSH"

print_info "Probando conexión a GitHub (escribe 'yes' si te pide confirmación)..."
echo ""

ssh -T git@github.com 2>&1

echo ""
# ssh -T git@github.com devuelve 1 incluso con éxito, así que verificamos el output
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    print_ok "Conexión SSH a GitHub verificada correctamente"
else
    print_warning "No se pudo verificar la conexión SSH"
    echo "Asegúrate de que:"
    echo "  - La clave pública está añadida a GitHub"
    echo "  - Esperaste a que GitHub procese la clave (unos minutos)"
    echo ""
fi

# ─────────────────────────────────────────────
# Paso 6: Configurar Git
# ─────────────────────────────────────────────
print_section "Paso 6: Configurar Git"

print_info "Verificando configuración de Git..."
echo ""

git_user=$(git config --global user.name 2>/dev/null)
git_email=$(git config --global user.email 2>/dev/null)

if [ -z "$git_user" ] || [ -z "$git_email" ]; then
    print_warning "Usuario o email de Git no configurados"
    echo ""

    read -p "Introduce tu nombre de usuario de GitHub: " git_username
    read -p "Introduce tu correo de GitHub: " git_email_input

    if [ -n "$git_username" ] && [ -n "$git_email_input" ]; then
        git config --global user.name "$git_username"
        git config --global user.email "$git_email_input"
        print_ok "Git configurado globalmente"
    fi
else
    print_ok "Git ya está configurado:"
    echo "   Usuario: $git_user"
    echo "   Correo: $git_email"
fi

# ─────────────────────────────────────────────
# Paso 7: Info sobre git clone
# ─────────────────────────────────────────────
print_section "Paso 7: Probando con Git"

print_info "Ahora puedes clonar repositorios usando SSH:"
echo ""
echo "  git clone git@github.com:usuario/repositorio.git"
echo ""

# ─────────────────────────────────────────────
# Resumen final
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Configuración Completada${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
print_ok "Clave SSH configurada para GitHub"
echo ""
echo "Ahora puedes:"
echo "  - Clonar repositorios usando SSH"
echo "  - Hacer push y pull sin introducir contraseña cada vez"
echo "  - Usar GitHub con mayor seguridad"
echo ""
echo "Tu clave se guarda con el Keychain de macOS, así que"
echo "no tendrás que añadirla de nuevo al reiniciar."
echo ""
print_info "Para más información, visita:"
echo "  https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
echo ""
print_ok "¡Configuración completada! ¡A programar!"
echo ""
