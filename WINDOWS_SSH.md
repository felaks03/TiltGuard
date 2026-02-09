# SSH para GitHub en Windows - Guía Completa

Guía para configurar autenticación SSH con GitHub en Windows 10/11.

## ¿Qué es SSH?

SSH (Secure Shell) es una forma segura de conectarte a GitHub sin necesidad de introducir tu contraseña cada vez. 

**Ventajas:**
- 🔒 Mayor seguridad
- ⚡ Más rápido (no pide contraseña)
- 🔑 Autenticación con claves criptográficas

## Requisitos previos

- Windows 10/11
- **Git instalado** (ejecuta `dylan.bat` primero si no lo tienes)
- Cuenta en GitHub
- El proyecto clonado (usa HTTPS primero si no tienes SSH configurado)

## Flujo recomendado

### Primer setup (una sola vez)

1. **Clona el proyecto con HTTPS** (descarga todo incluido `setup-ssh.bat`):
```powershell
git clone https://github.com/tu-usuario/TiltGuard.git
cd TiltGuard
```

2. **Instala dependencias** (esto incluye Git si no lo tienes):
```powershell
.\dylan.bat
```

3. **Configura SSH** (el archivo ahora está disponible porque ya clonaste):
```powershell
.\setup-ssh.bat
```

4. **(Opcional) Cambia a SSH** para futuros pull/push:
```powershell
git remote set-url origin git@github.com:tu-usuario/TiltGuard.git
```

### Uso posterior

Ya con SSH configurado, puedes clonar nuevos repos usando SSH:

```powershell
git clone git@github.com:usuario/repositorio.git
```

## Instalación rápida (4 pasos)

### Paso 1: Clonar con HTTPS (si aún no lo hiciste)

```powershell
git clone https://github.com/tu-usuario/TiltGuard.git
cd TiltGuard
```

### Paso 2: Instalar dependencias

```powershell
.\dylan.bat
```

### Paso 3: Abre PowerShell como administrador

Presiona `Windows + X` → "Windows PowerShell (Administrador)"

### Paso 4: Configura SSH

```powershell
cd C:\ruta\a\TiltGuard
.\setup-ssh.bat
```

El script hará todo automáticamente:
- ✓ Genera una clave SSH
- ✓ La copia al portapapeles
- ✓ Te guía para pegarla en GitHub
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

En Windows, las claves SSH se guardan en:

```
C:\Users\{tu_usuario}\.ssh\
```

Verás:
- `id_ed25519` - Clave privada (⚠️ NUNCA la compartas)
- `id_ed25519.pub` - Clave pública (la que copias a GitHub)
- `known_hosts` - Lista de servidores conocidos

---

## ¿Qué es la carpeta `.ssh`?

La carpeta `.ssh` está **oculta** por defecto en Windows.

Para verla:
1. Abre el Explorador
2. Navega a: `C:\Users\{tu_usuario}\`
3. Presiona `Ctrl + H` para mostrar carpetas ocultas
4. Verás la carpeta `.ssh`

---

## Si necesitas regenerar la clave

Simplemente ejecuta `setup-ssh.bat` de nuevo:

```powershell
.\setup-ssh.bat
```

Te preguntará si quieres crear una nueva clave. Selecciona "S" (Sí).

---

## Solución de problemas

### ❌ Error: "Git no está instalado"

Primero ejecuta `dylan.bat` para instalar Git:

```powershell
.\dylan.bat
```

### ❌ La conexión SSH no funciona

Espera 5-10 minutos después de añadir la clave a GitHub (necesita procesarla).

Luego intenta de nuevo:

```bash
ssh -T git@github.com
```

En PowerShell (con Git Bash):

```powershell
& "$env:ProgramFiles\Git\bin\bash" -c "ssh -T git@github.com"
```

### ❌ No aparece la carpeta .ssh

Asegúrate de:
1. Ejecutaste `setup-ssh.bat` correctamente
2. Presionaste Enter cuando pidió datos
3. No hay errores mostrados

Si aún no aparece, crea la carpeta manualmente:

```powershell
mkdir $env:USERPROFILE\.ssh
```

### ❌ "Permission denied (publickey)"

Significa que GitHub no reconoce tu clave. Verifica:
1. Copiaste la clave correctamente a GitHub
2. Esperaste a que se procese (5-10 minutos)
3. La clave está en el lugar correcto (`~/.ssh/id_ed25519.pub`)

### ❌ PowerShell dice "No se puede ejecutar setup-ssh.bat"

Ejecuta con `.bat` explícitamente:

```powershell
cmd /c setup-ssh.bat
```

O abre CMD en lugar de PowerShell.

---

## Verificar que funciona

Desde PowerShell o CMD:

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

Los scripts `dylan-run.bat` funcionarán perfectamente con SSH.

---

## Cambiar de HTTPS a SSH

Si ya clonaste el repo con HTTPS y quieres cambiar a SSH:

```bash
cd C:\ruta\a\TiltGuard
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
- Si sospechas que la clave privada fue comprometida, regenera una nueva inmediatamente.

---

## Comandos útiles

```bash
# Ver tu clave pública
type %USERPROFILE%\.ssh\id_ed25519.pub

# Copiar clave al portapapeles (PowerShell)
Get-Content ~\.ssh\id_ed25519.pub | Set-Clipboard

# Probar conexión SSH
ssh -T git@github.com

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
- **Tutorial SSH:** https://docs.github.com/en/authentication/troubleshooting-ssh
- **Generar claves SSH:** https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent

---

**Última actualización:** 9 de febrero de 2026

Cualquier duda o problema, consulta el archivo `WINDOWS_SETUP.md`.
