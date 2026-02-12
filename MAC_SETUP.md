# TiltGuard - Instalación en macOS

Guía completa para instalar y ejecutar TiltGuard en macOS (Intel y Apple Silicon M1/M2/M3/M4).

## Requisitos

Solo necesitas tener macOS con acceso a internet. Todos los programas se instalan automáticamente con el script.

El script `dylan-mac.sh` instalará:
- **Homebrew** - Gestor de paquetes para macOS (si no lo tienes)
- **Node.js** - Entorno de ejecución JavaScript
- **npm** - Gestor de paquetes Node.js
- **Docker Desktop** - Para MongoDB
- **Git** - Control de versiones
- **Angular CLI** - Framework para el frontend

## Instalación rápida

### Si aún no tienes el proyecto clonado

**Opción 1 - HTTPS (más fácil al principio):**

```bash
# 1. Abre Terminal (Cmd + Espacio → escribe "Terminal")

# 2. Navega donde quieras guardar el proyecto
cd ~/Desktop

# 3. Clona con HTTPS
git clone https://github.com/tu-usuario/TiltGuard.git

# 4. Entra a la carpeta
cd TiltGuard

# 5. Dale permisos de ejecución al script
chmod +x dylan-mac.sh

# 6. Ejecuta la instalación
./dylan-mac.sh
```

**Opción 2 - SSH (si ya lo tienes configurado):**

```bash
# 1. Abre Terminal
# 2. Clona con SSH
git clone git@github.com:tu-usuario/TiltGuard.git
cd TiltGuard
chmod +x dylan-mac.sh
./dylan-mac.sh
```

### Si ya tienes el proyecto

```bash
# 1. Abre Terminal
cd ~/Desktop/TiltGuard  # o donde lo tengas

# 2. Dale permisos y ejecuta
chmod +x dylan-mac.sh
./dylan-mac.sh
```

**¡Listo!** El script instalará todo automáticamente (toma 15-30 minutos).

> **Nota:** Si te pide contraseña durante la instalación, es la contraseña de tu usuario de Mac (la de inicio de sesión).

---

## Scripts disponibles

### 📦 dylan-mac.sh - Instalación inicial
**Ejecuta SOLO una vez al principio.** Instala todos los requisitos automáticamente:
- Homebrew (si falta)
- Node.js + npm
- Docker Desktop
- Git
- Angular CLI
- Dependencias del proyecto
- Archivos .env

```bash
./dylan-mac.sh
```

### ▶️ run.sh - Ejecutar proyecto (uso diario)

Menú interactivo para:
1. Matar puertos 4200 y 5000
2. Iniciar todo (Frontend + Backend + MongoDB)
3. Salir

```bash
./run.sh
```

### 🌿 dylan-run-mac.sh - Rama Dylan

Para desarrolladores trabajando en `DylanBranch`:
- Cambia a la rama Dylan
- Descarga cambios más recientes
- Inicia todo automáticamente

```bash
./dylan-run-mac.sh
```

### 🔑 setup-ssh-mac.sh - Configurar SSH para GitHub
**Ejecuta DESPUÉS de `dylan-mac.sh`.** Se necesita Git instalado.

Sirve para:
- Generar una clave SSH
- Añadirla al Keychain de macOS (no la pierdes al reiniciar)
- Guiarte para pegarla en GitHub
- Configurar Git

```bash
./setup-ssh-mac.sh
```

**Ver `MAC_SSH.md` para guía completa de SSH.**

---

## Cómo ejecutar los scripts

### Desde Terminal

```bash
# 1. Abre Terminal (Cmd + Espacio → "Terminal")
cd ~/Desktop/TiltGuard

# 2. Da permisos (solo la primera vez)
chmod +x dylan-mac.sh dylan-run-mac.sh setup-ssh-mac.sh run.sh

# 3. Ejecuta el que necesites
./dylan-mac.sh        # Instalación inicial
./dylan-run-mac.sh    # Iniciar rama Dylan
./setup-ssh-mac.sh    # Configurar SSH
./run.sh              # Iniciar proyecto normal
```

---

## Después de la instalación

Una vez que `dylan-mac.sh` termina:

1. **Asegúrate de que Docker Desktop esté abierto** (búscalo en Aplicaciones o Spotlight)
2. Ejecuta `./run.sh` o `./dylan-run-mac.sh`
3. Espera 30-60 segundos a que todo inicie
4. Abre http://localhost:4200 en tu navegador

### Extensión del navegador

Para usar la extensión:
1. Ve a `chrome://extensions` o `edge://extensions`
2. Habilita "Modo de desarrollador"
3. Clic en "Cargar extensión sin empaquetar"
4. Selecciona la carpeta `frontend/extension`

---

## Configurar SSH para GitHub (opcional pero recomendado)

Una vez que tengas el proyecto clonado y `dylan-mac.sh` ejecutado:

### 1️⃣ Primer setup: Clonar con HTTPS

```bash
git clone https://github.com/tu-usuario/TiltGuard.git
cd TiltGuard
```

### 2️⃣ Instalar dependencias

```bash
./dylan-mac.sh
```

### 3️⃣ Configurar SSH

```bash
./setup-ssh-mac.sh
```

### 4️⃣ (Opcional) Cambiar el origin a SSH

```bash
git remote set-url origin git@github.com:tu-usuario/TiltGuard.git
```

**Ver `MAC_SSH.md` para guía completa de SSH.**

---

## Solución de problemas

### ❌ "Permission denied" al ejecutar un script

Da permisos de ejecución:

```bash
chmod +x dylan-mac.sh dylan-run-mac.sh setup-ssh-mac.sh run.sh
```

### ❌ Homebrew no se instaló correctamente

Instálalo manualmente:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Si tienes **Apple Silicon** (M1/M2/M3/M4), añade Homebrew al PATH:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Si tienes **Intel Mac**:

```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

### ❌ Docker no inicia después de instalar

1. Busca "Docker" en Spotlight (Cmd + Espacio)
2. Abre Docker Desktop
3. Acepta los términos si te lo pide
4. Espera a que diga "Docker is running" (el icono de la ballena en la barra superior)
5. Ejecuta el script de nuevo

### ❌ Error: "command not found: brew" después de instalar

Cierra Terminal y ábrela de nuevo. Si sigue sin funcionar:

```bash
# Apple Silicon
eval "$(/opt/homebrew/bin/brew shellenv)"

# Intel Mac
eval "$(/usr/local/bin/brew shellenv)"
```

### ❌ Node.js no se encuentra después de instalar

Cierra y reabre Terminal. Homebrew añade Node al PATH automáticamente.

### ❌ Los puertos 4200 o 5000 están en uso

Usa la opción 1 de `run.sh`, o ejecútalos manualmente:

```bash
# Ver qué usa el puerto 4200
lsof -i :4200

# Matar el proceso
kill -9 $(lsof -ti :4200)

# Lo mismo para el 5000
kill -9 $(lsof -ti :5000)
```

### ❌ Falta archivo .env

Los scripts crean automáticamente archivos .env. Si faltan:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### ❌ "xcrun: error: invalid active developer path"

Instala las Command Line Tools de Xcode:

```bash
xcode-select --install
```

---

## Detener el proyecto

- **Opción 1:** Presiona `Ctrl+C` en la terminal donde corre el proyecto
- **Opción 2:** Usa `./run.sh` opción 1 para liberar puertos
- **Opción 3:** Manualmente:

```bash
# Matar puertos
kill -9 $(lsof -ti :4200) 2>/dev/null
kill -9 $(lsof -ti :5000) 2>/dev/null

# Parar Docker
docker-compose down
```

---

## Comandos útiles

```bash
# Ver puertos en uso
lsof -i :4200
lsof -i :5000

# Matar proceso en un puerto
kill -9 $(lsof -ti :4200)

# Ver versiones instaladas
node -v
npm -v
docker --version
git --version

# Ver logs de Docker
docker-compose logs -f mongodb

# Acceder a MongoDB Shell
docker exec -it tiltguard-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# Limpiar completamente
rm -rf backend/node_modules frontend/node_modules
docker-compose down -v
```

---

## ¿Necesitas ayuda?

1. ✅ Verifica que tienes conexión a internet
2. ✅ Asegúrate de que Docker Desktop está abierto
3. ✅ Ejecuta `./dylan-mac.sh` nuevamente
4. ✅ Si nada funciona, elimina `node_modules` y ejecuta instalación de nuevo:

```bash
rm -rf backend/node_modules frontend/node_modules
./dylan-mac.sh
```

---

**Última actualización:** 12 de febrero de 2026
