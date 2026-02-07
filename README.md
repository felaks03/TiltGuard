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

### Instalación Completa

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

### Script de Inicio Rápido
```bash
./run.sh
```

## Estructura de Carpetas Frontend

**Norma:** Dentro de `admin/`, `main/` y `pages/` solo deben haber carpetas con componentes, no archivos sueltos.

- **`admin/`** - Panel de administración
  - `dashboard/` - Dashboard del administrador
  - `userlist/` - Listado de usuarios (gestión)
- **`main/`** - Componentes principales del usuario
  - `dashboard/` - Dashboard del usuario (en desarrollo)
  - `user/` - Gestión de usuario principal
- **`pages/`** - Componentes compartidos
  - `header/` - Encabezado de la aplicación
  - `sidebar/` - Barra lateral de navegación

## Próximos Pasos
- [x] Crear modelos de usuario (Mongoose)
- [x] Implementar rutas de API
- [x] Crear estructura Angular modular
- [ ] Implementar autenticación (JWT)
- [ ] Sistema de roles (Admin/Usuario)
- [ ] Validaciones en formularios
- [ ] Testing
