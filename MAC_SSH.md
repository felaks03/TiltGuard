# SSH para GitHub en macOS - Guía Completa

Guía para configurar autenticación SSH con GitHub en macOS (Intel y Apple Silicon).

## ¿Qué es SSH?

SSH (Secure Shell) es una forma segura de conectarte a GitHub sin necesidad de introducir tu contraseña cada vez.

**Ventajas:**
- 🔒 Mayor seguridad
- ⚡ Más rápido (no pide contraseña)
- 🔑 Autenticación con claves criptográficas
- 🍎 Se integra con el Keychain de macOS (no pierdes la clave al reiniciar)

## Requisitos previos

- macOS (cualquier versión reciente)
- **Git instalado** (ejecuta `./dylan-mac.sh` primero si no lo tienes)
- Cuenta en GitHub
- El proyecto clonado (usa HTTPS primero si no tienes SSH configurado)

## Flujo recomendado

### Primer setup (una sola vez)

1. **Clona el proyecto con HTTPS** (descarga todo incluido `setup-ssh-mac.sh`):
```bash
git clone https://github.com/tu-usuario/TiltGuard.git
cd TiltGuard
```

2. **Instala dependencias** (esto incluye Git si no lo tienes):
```bash
chmod +x dylan-mac.sh
./dylan-mac.sh
```

3. **Configura SSH** (el archivo ahora está disponible porque ya clonaste):
```bash
chmod +x setup-ssh-mac.sh
./setup-ssh-mac.sh
```

4. **(Opcional) Cambia a SSH** para futuros pull/push:
```bash
git remote set-url origin git@github.com:tu-usuario/TiltGuard.git
```

### Uso posterior

Ya con SSH configurado, puedes clonar nuevos repos usando SSH:

```bash
git clone git@github.com:usuario/repositorio.git
```

---

## Instalación rápida (4 pasos)

### Paso 1: Clonar con HTTPS (si aún no lo hiciste)

```bash
git clone https://github.com/tu-usuario/TiltGuard.git
cd TiltGuard
```

### Paso 2: Instalar dependencias

```bash
./dylan-mac.sh
```

### Paso 3: Abrir Terminal

Presiona `Cmd + Espacio` → escribe "Terminal" → Enter

### Paso 4: Configura SSH

```bash
cd ~/Desktop/TiltGuard   # o donde lo tengas
./setup-ssh-mac.sh
```

El script hará todo automáticamente:
- ✓ Genera una clave SSH (ed25519)
- ✓ La añade al Keychain de macOS
- ✓ La copia al portapapeles
- ✓ Te abre GitHub para pegarla
- ✓ Verifica la conexión
- ✓ Configura Git

---

## Uso después del setup

Una vez configurado SSH, puedes usar Git de dos formas:

### Clonar con SSH (recomendado)

```bash
git clone git@github.com:usuario/repositorio.git
```

### Clonar con HTTPS (alternativa)

```bash
git clone https://github.com/usuario/repositorio.git
```

**Diferencia:** Con SSH no te pide contraseña. Con HTTPS tienes que introducir token/contraseña.

---

## Dónde se guarda la clave SSH

En macOS, las claves SSH se guardan en:

```
~/.ssh/
```

Que es lo mismo que: `/Users/{tu_usuario}/.ssh/`

Verás:
- `id_ed25519` - Clave privada (⚠️ NUNCA la compartas)
- `id_ed25519.pub` - Clave pública (la que copias a GitHub)
- `config` - Configuración SSH (creado por el script)
- `known_hosts` - Lista de servidores conocidos

### Ver la carpeta .ssh

La carpeta `.ssh` está oculta. Para verla:

**Desde Terminal:**
```bash
ls -la ~/.ssh/
```

**Desde Finder:**
1. Abre Finder
2. Presiona `Cmd + Shift + G`
3. Escribe `~/.ssh` y Enter

---

## Ventaja en macOS: Keychain

El script configura SSH para usar el **Keychain de macOS**, lo que significa que:
- Tu clave SSH se almacena de forma segura en el Keychain
- **No necesitas añadirla de nuevo al reiniciar**
- Se gestiona automáticamente

Esto se configura en `~/.ssh/config`:

```
Host github.com
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519
```

---

## Si necesitas regenerar la clave

Simplemente ejecuta `setup-ssh-mac.sh` de nuevo:

```bash
./setup-ssh-mac.sh
```

Te preguntará si quieres crear una nueva clave. Selecciona "S" (Sí).

---

## Solución de problemas

### ❌ Error: "Git no está instalado"

Primero ejecuta `dylan-mac.sh` para instalar Git:

```bash
./dylan-mac.sh
```

O instálalo manualmente:

```bash
brew install git
```

### ❌ La conexión SSH no funciona

Espera 2-5 minutos después de añadir la clave a GitHub.

Luego intenta de nuevo:

```bash
ssh -T git@github.com
```

### ❌ "Permission denied (publickey)"

Significa que GitHub no reconoce tu clave. Verifica:

1. Copiaste la clave correctamente a GitHub
2. Esperaste a que se procese (2-5 minutos)
3. La clave está en el lugar correcto:

```bash
cat ~/.ssh/id_ed25519.pub
```

4. La clave está cargada en el agent:

```bash
ssh-add -l
```

Si no aparece, añádela:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

### ❌ "No such file or directory" al ejecutar el script

Dale permisos de ejecución:

```bash
chmod +x setup-ssh-mac.sh
```

### ❌ Error "xcrun: error: invalid active developer path"

Instala las Command Line Tools:

```bash
xcode-select --install
```

### ❌ La clave no se mantiene después de reiniciar

Verifica que tu archivo `~/.ssh/config` tiene:

```
Host github.com
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519
```

Si no lo tiene, ejecuta `./setup-ssh-mac.sh` de nuevo.

---

## Verificar que funciona

Desde Terminal:

```bash
ssh -T git@github.com
```

Si funciona, verás algo como:

```
Hi username! You've successfully authenticated,
but GitHub does not provide shell access.
```

---

## Integración con TiltGuard

Una vez configurado SSH, al trabajar en TiltGuard:

1. **Clonar el repo:**
```bash
git clone git@github.com:tu-usuario/TiltGuard.git
```

2. **Push/Pull sin contraseña:**
```bash
git push origin DylanBranch
git pull origin DylanBranch
```

Los scripts `dylan-run-mac.sh` funcionarán perfectamente con SSH.

---

## Cambiar de HTTPS a SSH

Si ya clonaste el repo con HTTPS y quieres cambiar a SSH:

```bash
cd ~/Desktop/TiltGuard
git remote set-url origin git@github.com:tu-usuario/TiltGuard.git
```

Verifica que cambió:

```bash
git remote -v
```

Deberías ver `git@github.com` en lugar de `https://github.com`.

---

## Seguridad

⚠️ **IMPORTANTE:**

- **Clave privada** (`id_ed25519`) - NUNCA la compartas. Mantenla segura.
- **Clave pública** (`id_ed25519.pub`) - Puedes compartirla, es segura.
- macOS Keychain almacena tu clave de forma encriptada.
- Si sospechas que la clave privada fue comprometida, regenera una nueva inmediatamente.

---

## Comandos útiles

```bash
# Ver tu clave pública
cat ~/.ssh/id_ed25519.pub

# Copiar clave al portapapeles
pbcopy < ~/.ssh/id_ed25519.pub

# Probar conexión SSH
ssh -T git@github.com

# Ver claves en el SSH agent
ssh-add -l

# Añadir clave al agent + Keychain
ssh-add --apple-use-keychain ~/.ssh/id_ed25519

# Ver configuración de Git
git config --global --list

# Cambiar nombre de usuario Git
git config --global user.name "Tu Nombre"

# Cambiar correo de Git
git config --global user.email "tu@email.com"
```

---

## Más información

- **Documentación oficial GitHub:** https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- **Tutorial SSH macOS:** https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent
- **Keychain en macOS:** https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent#adding-your-ssh-key-to-the-ssh-agent

---

**Última actualización:** 12 de febrero de 2026

Cualquier duda o problema, consulta el archivo `MAC_SETUP.md`.
