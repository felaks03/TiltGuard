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

# Asegurar permisos correctos (causa común de errores)
print_info "Configurando permisos de archivos SSH..."
chmod 700 "$SSH_DIR"
chmod 600 "$SSH_KEY"
chmod 644 "$SSH_KEY_PUB"
print_ok "Permisos configurados correctamente"

# ─────────────────────────────────────────────
# Paso 2: Configurar SSH Agent
# ─────────────────────────────────────────────
print_section "Paso 2: Configurando SSH Agent"

# Iniciar ssh-agent
print_info "Iniciando SSH agent..."
eval "$(ssh-agent -s)" > /dev/null 2>&1
print_ok "SSH agent iniciado"

# Crear/actualizar config de SSH para que use Keychain en macOS
SSH_CONFIG="$SSH_DIR/config"

# Si existe config anterior para github.com, la eliminamos para recrearla limpia
if [ -f "$SSH_CONFIG" ] && grep -q "github.com" "$SSH_CONFIG" 2>/dev/null; then
    print_info "Actualizando configuración SSH existente para GitHub..."
    # Eliminar bloque anterior de github.com
    sed -i.bak '/# GitHub SSH config/,/IdentityFile.*id_ed25519/d' "$SSH_CONFIG" 2>/dev/null
    rm -f "${SSH_CONFIG}.bak"
fi

print_info "Configurando SSH para GitHub con Keychain de macOS..."

cat >> "$SSH_CONFIG" << EOF

# GitHub SSH config (añadido por setup-ssh-mac.sh)
Host github.com
    HostName github.com
    User git
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519
EOF

chmod 600 "$SSH_CONFIG"
print_ok "Configuración SSH creada"

# Añadir clave al ssh-agent con Keychain (probar múltiples métodos)
print_info "Añadiendo clave al SSH agent y Keychain..."
ssh-add --apple-use-keychain "$SSH_KEY" 2>/dev/null
if [ $? -ne 0 ]; then
    ssh-add -K "$SSH_KEY" 2>/dev/null
    if [ $? -ne 0 ]; then
        ssh-add "$SSH_KEY" 2>/dev/null
    fi
fi

# Verificar que la clave está cargada
if ssh-add -l 2>/dev/null | grep -q "ed25519"; then
    print_ok "Clave añadida al SSH agent y al Keychain de macOS"
else
    print_warning "No se pudo verificar la clave en el agent. Intentando de nuevo..."
    eval "$(ssh-agent -s)" > /dev/null 2>&1
    ssh-add "$SSH_KEY" 2>/dev/null
    if ssh-add -l 2>/dev/null | grep -q "ed25519"; then
        print_ok "Clave añadida al SSH agent en segundo intento"
    else
        print_error "No se pudo añadir la clave al agent"
        echo "Ejecuta manualmente:"
        echo "  eval \"\$(ssh-agent -s)\""
        echo "  ssh-add ~/.ssh/id_ed25519"
    fi
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

# Añadir GitHub a known_hosts automáticamente (evita el prompt "Are you sure...")
print_info "Añadiendo GitHub a hosts conocidos..."
ssh-keyscan -t ed25519 github.com >> "$SSH_DIR/known_hosts" 2>/dev/null
ssh-keyscan -t rsa github.com >> "$SSH_DIR/known_hosts" 2>/dev/null
chmod 600 "$SSH_DIR/known_hosts" 2>/dev/null
print_ok "GitHub añadido a hosts conocidos"
echo ""

print_info "Probando conexión a GitHub..."
echo ""

# ssh -T git@github.com devuelve exit code 1 incluso con éxito, así que verificamos el output
SSH_OUTPUT=$(ssh -T git@github.com 2>&1)
echo "$SSH_OUTPUT"
echo ""

if echo "$SSH_OUTPUT" | grep -qi "successfully authenticated"; then
    print_ok "Conexión SSH a GitHub verificada correctamente"
else
    print_warning "No se pudo verificar la conexión SSH"
    echo ""
    echo "Soluciones:"
    echo "  1. Verifica que la clave pública está añadida a GitHub:"
    echo "     https://github.com/settings/keys"
    echo ""
    echo "  2. Ejecuta esto para ver el error detallado:"
    echo "     ssh -vT git@github.com"
    echo ""
    echo "  3. Asegúrate de que la clave está en el agent:"
    echo "     ssh-add -l"
    echo ""
    echo "  4. Si no aparece, añádela manualmente:"
    echo "     eval \"\$(ssh-agent -s)\""
    echo "     ssh-add --apple-use-keychain ~/.ssh/id_ed25519"
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
