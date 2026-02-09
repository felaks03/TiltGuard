# TiltGuard - Instalación en Windows

Guía completa para instalar y ejecutar TiltGuard en Windows 10/11.

## Requisitos

Solo necesitas tener Windows 10/11 con acceso a internet. Todos los programas se instalan automáticamente.

El script `dylan.bat` instalará:
- **Node.js** - Entorno de ejecución JavaScript
- **npm** - Gestor de paquetes Node.js
- **Docker Desktop** - Para MongoDB
- **Git** - Control de versiones
- **Chocolatey** - Gestor de paquetes Windows (si no lo tienes)

## Instalación rápida

### Si aún no tienes el proyecto clonado

**Opción 1 - HTTPS (más fácil al principio):**

```powershell
# 1. Abre PowerShell como administrador (Windows + X)
# 2. Navega donde quieras guardar el proyecto
cd C:\

# 3. Clona con HTTPS
git clone https://github.com/tu-usuario/TiltGuard.git

# 4. Entra a la carpeta
cd TiltGuard

# 5. Ejecuta la instalación
.\dylan.bat
```

**Opción 2 - SSH (si ya lo tienes configurado):**

```powershell
# 1. Primero configura SSH (ver sección SSH más abajo)
# 2. Luego clona
git clone git@github.com:tu-usuario/TiltGuard.git
cd TiltGuard
.\dylan.bat
```

### Si ya tienes el proyecto

```powershell
# 1. Abre PowerShell como administrador
# 2. Navega al proyecto
cd C:\ruta\a\TiltGuard

# 3. Ejecuta la instalación
.\dylan.bat
```

**¡Listo!** El script instalará todo automáticamente (toma 20-30 minutos).

## Scripts disponibles

## Scripts disponibles

### 📦 dylan.bat - Instalación inicial
**Ejecuta SOLO una vez al principio.** Instala todos los requisitos automáticamente:
- Chocolatey (si falta)
- Node.js + npm
- Docker Desktop
- Git
- Dependencias del proyecto
- Archivos .env

```powershell
.\dylan.bat
```

### ▶️ run.bat - Ejecutar proyecto (uso diario)

Menú interactivo para:
1. Matar puertos 4200 y 5000
2. Iniciar todo (Frontend + Backend + MongoDB)
3. Salir

```powershell
.\run.bat
```

### 🌿 dylan-run.bat - Rama Dylan

Para desarrolladores trabajando en `DylanBranch`:
- Cambia a la rama Dylan
- Descarga cambios más recientes
- Inicia todo automáticamente

```powershell
.\dylan-run.bat
```

### 🔑 setup-ssh.bat - Configurar SSH para GitHub
**Ejecuta DESPUÉS de `dylan.bat`.** Se necesita Git instalado (que lo hace `dylan.bat`).

El archivo está en el proyecto (ya lo tendrás clonado). Sirve para:
- Generar una clave SSH
- Añadirla a GitHub
- Configurar Git

```powershell
.\setup-ssh.bat
```

**Ver `WINDOWS_SSH.md` para guía completa.**

## Cómo ejecutar los scripts

### Desde PowerShell (recomendado)

```powershell
cd C:\ruta\a\TiltGuard
.\dylan.bat
```

### Desde CMD

```batch
cd C:\ruta\a\TiltGuard
dylan.bat
```

### Desde el Explorador

Haz clic derecho en el archivo `.bat` → "Ejecutar como administrador"

---

## Configurar SSH para GitHub (opcional pero recomendado)

Una vez que tengas el proyecto clonado y `dylan.bat` ejecutado, puedes configurar SSH:

### 1️⃣ Primer setup: Clonar con HTTPS

```powershell
git clone https://github.com/tu-usuario/TiltGuard.git
cd TiltGuard
```

### 2️⃣ Instalar dependencias

```powershell
.\dylan.bat
```

### 3️⃣ Configurar SSH

Ahora que tienes Git instalado y el proyecto clonado, ejecuta:

```powershell
.\setup-ssh.bat
```

### 4️⃣ (Opcional) Cambiar a SSH

Para futuros push/pull sin contraseña:

```powershell
git remote set-url origin git@github.com:tu-usuario/TiltGuard.git
```

**Ver `WINDOWS_SSH.md` para guía completa de SSH.**

## Después de la instalación

Una vez que `dylan.bat` termina:

1. Ejecuta `run.bat`
2. Selecciona opción **2** para iniciar el proyecto
3. Espera 30-60 segundos a que todo inicie
4. Abre http://localhost:4200 en tu navegador

### Extensión del navegador

Para usar la extensión:
1. Ve a `chrome://extensions` o `edge://extensions`
2. Habilita "Modo de desarrollador"
3. Clic en "Cargar extensión sin empaquetar"
4. Selecciona la carpeta `frontend\extension`

## Solución de problemas

### ❌ Error: "Ejecutar como administrador"

Los scripts necesitan permisos de administrador. Abre PowerShell o CMD con clic derecho → "Ejecutar como administrador".

### ❌ Error de Chocolatey

Si Chocolatey no se instala automáticamente, abre PowerShell como administrador y ejecuta:

```powershell
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Luego cierra y reabre PowerShell, y ejecuta `dylan.bat` de nuevo.

### ❌ Docker no inicia después de instalar

1. Busca "Docker Desktop" en Inicio
2. Abre Docker Desktop
3. Espera a que diga "Docker is running"
4. Ejecuta `dylan.bat` de nuevo

### ❌ Node.js no se encuentra después de instalar

Cierra completamente PowerShell/CMD y abre una nueva ventana como administrador. El PATH se actualiza automáticamente.

### ❌ Los puertos 4200 o 5000 están en uso

Usa la opción 1 de `run.bat` para matar los procesos automáticamente.

Si persiste, usa estos comandos:

```batch
REM Ver qué usa el puerto 4200
netstat -ano | findstr :4200

REM Matar el proceso (reemplaza <PID> con el número)
taskkill /PID <PID> /F
```

### ❌ Falta archivo .env

Los scripts crean automáticamente archivos .env. Si faltan:

```batch
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

## Detener el proyecto

- **Opción 1:** Cierra las ventanas de terminal del backend y frontend
- **Opción 2:** Usa `run.bat` opción 1 para liberar puertos
- **Opción 3:** En PowerShell presiona `Ctrl+C` dos veces

## Comandos útiles

```batch
REM Ver puertos en uso
netstat -ano | findstr :4200

REM Matar proceso por PID
taskkill /PID <numero> /F

REM Ver lista de procesos
tasklist

REM Limpiar pantalla
cls

REM Ver versiones instaladas
node -v
npm -v
docker --version
git --version
```

---

## ¿Necesitas ayuda?

1. ✅ Verifica que tienes permisos de administrador
2. ✅ Asegúrate de tener conexión a internet
3. ✅ Ejecuta `dylan.bat` nuevamente
4. ✅ Si nada funciona, elimina carpetas `node_modules` y `docker-compose.yml` y ejecuta `dylan.bat` de nuevo

---

**Última actualización:** 9 de febrero de 2026
