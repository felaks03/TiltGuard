# 🚀 TiltGuard - Landing Page & Sistema de Registro

Sistema completo de landing page y registro de usuarios con **Angular (Frontend)**, **Node.js/Express (Backend)** y **MongoDB (Base de Datos)**.

---

## 📋 Requisitos Previos

Antes de empezar, necesitas tener instalado:

### ✅ Obligatorio
- **Node.js** (v18 o superior) - [Descargar](https://nodejs.org/)
- **npm** (viene con Node.js)
- **Docker** y **Docker Compose** - [Descargar](https://www.docker.com/)
- **Git** (opcional pero recomendado)

### Verificar instalación:
```bash
node --version    # v18.0.0 o superior
npm --version     # 9.0.0 o superior
docker --version  # Docker version 20.0.0 o superior
```

---

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
cd /home/felixpop/Escritorio/TiltGuard
```

### 2. Iniciar todo automáticamente
```bash
./run.sh
```

Este script hace lo siguiente automáticamente:
- ✓ Inicia MongoDB en Docker (puerto 27017)
- ✓ Instala dependencias del Backend
- ✓ Instala dependencias del Frontend
- ✓ Inicia el servidor Backend (puerto 5000)
- ✓ Inicia el servidor Frontend (puerto 4200)

---

## 🌐 Acceso a los Servicios

Una vez que corras `./run.sh`, tendrás acceso a:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:4200 | Landing page y registro |
| **Backend API** | http://localhost:5000 | API REST |
| **MongoDB** | localhost:27017 | Base de datos |
| **Mongo Express** | http://localhost:8081 | GUI para administrar MongoDB |

### Credenciales MongoDB:
```
Usuario: admin
Contraseña: password123
```

---

## 📁 Estructura del Proyecto

```
TiltGuard/
├── frontend/                    # Proyecto Angular
│   ├── src/
│   │   ├── app/               # Componentes y servicios
│   │   ├── assets/            # Imágenes, iconos, etc.
│   │   └── environments/      # Configuración de entornos
│   ├── extension/             # Extensión del navegador
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
│
├── backend/                     # API Node.js/Express
│   ├── src/
│   │   ├── models/            # Esquemas Mongoose
│   │   ├── routes/            # Rutas API
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── middleware/        # Middlewares (auth, etc)
│   │   ├── config/            # Configuración
│   │   └── index.js           # Servidor principal
│   ├── package.json
│   ├── .env.example
│   └── .dockerignore
│
├── docker-compose.yml          # Configuración Docker (MongoDB)
├── run.sh                       # Script para iniciar TODO
└── README.md                    # Este archivo
```

---

## 🔧 Próximos Pasos - TODO

Antes de que el proyecto esté listo, necesitas:

### Backend
- [ ] Crear modelo de Usuario en Mongoose (`backend/src/models/User.js`)
- [ ] Crear controlador de usuarios (`backend/src/controllers/userController.js`)
- [ ] Crear rutas de autenticación (`backend/src/routes/auth.js`)
- [ ] Implementar middleware de autenticación (JWT)
- [ ] Conectar la base de datos MongoDB en `index.js`
- [ ] Crear endpoint de registro
- [ ] Crear endpoint de login
- [ ] Crear endpoint de obtener datos de usuario

### Frontend
- [ ] Crear componente Landing Page
- [ ] Crear componente Formulario de Registro
- [ ] Crear servicio de autenticación (AuthService)
- [ ] Crear servicio de usuarios (UserService)
- [ ] Diseñar interfaz con estilos
- [ ] Validación de formularios
- [ ] Gestión de estado (RxJS/Observable)
- [ ] Rutas de navegación

**⚠️ IMPORTANTE - Estructura de Componentes:**
Cada componente de Angular debe tener la siguiente estructura:
```
ComponentName/
├── component-name.component.ts       # Lógica del componente
├── component-name.component.html     # Template
├── component-name.component.scss     # Estilos
├── component-name.module.ts          # Módulo del componente
└── component-name.service.ts         # Servicio asociado
```
- Cada componente **DEBE** tener su propio `module.ts`
- Cada componente **DEBE** tener su propio `service.ts` (aunque sea vacío inicialmente)

### General
- [ ] Variables de entorno configuradas (.env)
- [ ] Tests unitarios
- [ ] Documentación de API
- [ ] Deploy en producción

---

## 🚨 Problemas Comunes

### "Docker no está instalado"
Instala Docker desde: https://www.docker.com/products/docker-desktop

### "Puerto 27017 ya está en uso"
Si MongoDB ya corre localmente, ciérralo o cambia el puerto en `docker-compose.yml`

### "npm: command not found"
Instala Node.js desde: https://nodejs.org/

### "Permission denied" al ejecutar run.sh
Ejecuta: `chmod +x run.sh`

---

## 📖 Comandos Útiles

```bash
# Iniciar todo
./run.sh

# Ver logs de Docker
docker-compose logs -f mongodb

# Acceder a MongoDB Shell
docker exec -it tiltguard-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# Detener todo (Ctrl+C en la terminal del script)
# O manualmente:
docker-compose down
```

---

## 🔐 Seguridad

**⚠️ IMPORTANTE - Para Producción:**
- Cambiar credenciales de MongoDB en `docker-compose.yml`
- Cambiar `JWT_SECRET` en `.env`
- Usar HTTPS
- Validar todas las entrada del usuario
- Implementar rate limiting

---

## 📞 Soporte

Para más información sobre los frameworks usados:
- [Angular Docs](https://angular.io/docs)
- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Docker Docs](https://docs.docker.com/)

---

**Última actualización:** 7 de febrero de 2026
