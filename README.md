# TiltGuard - Landing Page & User Registration System

Sistema de landing page y registro de usuarios con frontend Angular y backend Node.js/Express/MongoDB.

**⚠️ NOTA IMPORTANTE:** Este proyecto utiliza **TypeScript** para todo el código (Frontend y Backend).

## Estructura del Proyecto

```
TiltGuard/
├── docker-compose.yml  # Configuración de MongoDB con Docker
├── run.sh             # Script para iniciar proyecto
├── extension/         # Extensión del navegador original
├── frontend/          # Proyecto Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/              # Panel de administración
│   │   │   │   ├── dashboard/      # Dashboard del admin
│   │   │   │   │   ├── dashboard.component.ts
│   │   │   │   │   ├── dashboard.component.html
│   │   │   │   │   ├── dashboard.component.scss
│   │   │   │   │   └── dashboard.component.module.ts
│   │   │   │   └── userlist/       # Listado de usuarios (admin)
│   │   │   │       ├── user.component.ts
│   │   │   │       ├── user.component.html
│   │   │   │       ├── user.component.scss
│   │   │   │       ├── user.module.ts
│   │   │   │       └── user.service.ts
│   │   │   ├── main/               # Componentes principales del usuario
│   │   │   │   ├── dashboard/      # Dashboard del usuario
│   │   │   │   │   ├── dashboard.component.ts
│   │   │   │   │   ├── dashboard.component.html
│   │   │   │   │   ├── dashboard.component.scss
│   │   │   │   │   └── dashboard.component.module.ts
│   │   │   │   └── user/           # Gestión de usuario principal
│   │   │   │       ├── user.component.ts
│   │   │   │       ├── user.component.html
│   │   │   │       ├── user.component.scss
│   │   │   │       ├── user.module.ts
│   │   │   │       └── user.service.ts
│   │   │   ├── pages/              # Componentes compartidos
│   │   │   │   ├── header/
│   │   │   │   │   ├── header.component.ts
│   │   │   │   │   ├── header.component.html
│   │   │   │   │   ├── header.component.scss
│   │   │   │   │   ├── header.module.ts
│   │   │   │   │   └── header.service.ts
│   │   │   │   └── sidebar/
│   │   │   │       ├── sidebar.component.ts
│   │   │   │       ├── sidebar.component.html
│   │   │   │       ├── sidebar.component.scss
│   │   │   │       ├── sidebar.module.ts
│   │   │   │       └── sidebar.service.ts
│   │   │   ├── app.component.ts    # Componente raíz
│   │   │   ├── app.routes.ts       # Definición de rutas
│   │   │   └── app.config.ts       # Configuración
│   │   ├── assets/                 # Imágenes, iconos, etc.
│   │   └── environments/           # Configuración por entorno
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
└── backend/           # API Node.js/Express/TypeScript
    ├── src/
    │   ├── models/    # Modelos Mongoose
    │   ├── routes/    # Rutas de API
    │   ├── controllers/
    │   ├── middleware/
    │   ├── config/    # Configuración (BD, etc)
    │   ├── scripts/   # Scripts de inicialización
    │   └── index.ts   # Servidor principal
    ├── package.json
    ├── tsconfig.json
    └── .env.example
```

## Instalación

### Requisitos Previos
- Docker y Docker Compose
- Node.js 18+ y npm
- MongoDB (incluido en Docker)

### Instalación Automática (Recomendado)

#### macOS
```bash
git clone https://github.com/tu-usuario/TiltGuard.git
cd TiltGuard
chmod +x dylan-mac.sh dylan-run-mac.sh setup-ssh-mac.sh run.sh
./dylan-mac.sh          # Instala todo (Homebrew, Node, Docker, Git, dependencias)
./dylan-run-mac.sh      # Inicia el proyecto en la rama Dylan
```
> **Ver `MAC_SETUP.md` para guía completa de macOS.**

#### Windows
```powershell
git clone https://github.com/tu-usuario/TiltGuard.git
cd TiltGuard
.\dylan.bat             # Instala todo (Chocolatey, Node, Docker, Git, dependencias)
.\dylan-run.bat         # Inicia el proyecto en la rama Dylan
```
> **Ver `WINDOWS_SETUP.md` para guía completa de Windows.**

#### Linux
```bash
git clone https://github.com/tu-usuario/TiltGuard.git
cd TiltGuard
chmod +x run.sh
./run.sh                # Inicia el proyecto
```

### Instalación Manual

1. **Clonar el proyecto**
```bash
git clone <repositorio>
cd TiltGuard
```

2. **Iniciar MongoDB con Docker**
```bash
docker-compose up -d
```

3. **Instalar dependencias del Backend**
```bash
cd backend
npm install
```

4. **Iniciar el Backend**
```bash
npm run dev  # Con hot-reload
# o
npm start    # Modo producción
```

5. **En otra terminal, instalar dependencias del Frontend**
```bash
cd frontend
npm install
```

6. **Iniciar el Frontend**
```bash
ng serve
# o acceder en http://localhost:4200
```

### Scripts Disponibles

| Script | SO | Descripción |
|--------|-----|-------------|
| `dylan-mac.sh` | macOS | Instalación completa (una sola vez) |
| `dylan-run-mac.sh` | macOS | Iniciar proyecto en rama Dylan |
| `setup-ssh-mac.sh` | macOS | Configurar SSH para GitHub |
| `dylan.bat` | Windows | Instalación completa (una sola vez) |
| `dylan-run.bat` | Windows | Iniciar proyecto en rama Dylan |
| `setup-ssh.bat` | Windows | Configurar SSH para GitHub |
| `run.sh` | Linux/macOS | Iniciar proyecto (menú interactivo) |

### Configurar SSH para GitHub

- **macOS:** `./setup-ssh-mac.sh` (ver `MAC_SSH.md`)
- **Windows:** `.\setup-ssh.bat` (ver `WINDOWS_SSH.md`)

## Estructura de Carpetas Frontend

**Norma:** Dentro de `admin/`, `main/` y `pages/` solo deben haber carpetas con componentes, no archivos sueltos.

### Estructura de Cada Componente

**IMPORTANTE:** Cada componente debe tener exactamente estos 5 archivos:

```
component-name/
├── component-name.component.ts       # Lógica del componente
├── component-name.component.html     # Template HTML
├── component-name.component.scss     # Estilos
├── component-name.component.module.ts # Módulo Angular
└── component-name.service.ts         # Servicio (lógica compartida)
```

**Ejemplo para dashboard:**
```
dashboard/
├── dashboard.component.ts
├── dashboard.component.html
├── dashboard.component.scss
├── dashboard.component.module.ts
└── dashboard.service.ts
```

### Carpetas de Componentes

- **`admin/`** - Panel de administración
  - `dashboard/` - Dashboard del administrador (5 archivos)
    - dashboard.component.ts
    - dashboard.component.html
    - dashboard.component.scss
    - dashboard.component.module.ts
    - dashboard.service.ts
  - `userlist/` - Listado de usuarios (5 archivos)
    - userlist.component.ts
    - userlist.component.html
    - userlist.component.scss
    - userlist.component.module.ts
    - userlist.service.ts

- **`main/`** - Componentes principales del usuario
  - `dashboard/` - Dashboard del usuario (5 archivos)
    - dashboard.component.ts
    - dashboard.component.html
    - dashboard.component.scss
    - dashboard.component.module.ts
    - dashboard.service.ts
  - `user/` - Gestión de usuario principal (5 archivos)
    - user.component.ts
    - user.component.html
    - user.component.scss
    - user.component.module.ts
    - user.service.ts

- **`pages/`** - Componentes compartidos
  - `header/` - Encabezado de la aplicación (5 archivos)
    - header.component.ts
    - header.component.html
    - header.component.scss
    - header.component.module.ts
    - header.service.ts
  - `sidebar/` - Barra lateral de navegación (5 archivos)
    - sidebar.component.ts
    - sidebar.component.html
    - sidebar.component.scss
    - sidebar.component.module.ts
    - sidebar.service.ts
  - `login/` - Página de login (5 archivos)
    - login.component.ts
    - login.component.html
    - login.component.scss
    - login.component.module.ts
    - login.service.ts
  - `register/` - Página de registro (5 archivos)
    - register.component.ts
    - register.component.html
    - register.component.scss
    - register.component.module.ts
    - register.service.ts

## Próximos Pasos
- [x] Crear modelos de usuario (Mongoose)
- [x] Implementar rutas de API
- [x] Crear estructura Angular modular
- [ ] Implementar autenticación (JWT)
- [ ] Sistema de roles (Admin/Usuario)
- [ ] Validaciones en formularios
- [ ] Testing
