# TiltGuard - Landing Page & User Registration System

Sistema de landing page y registro de usuarios con frontend Angular y backend Node.js/Express/MongoDB.

## Estructura del Proyecto

```
TiltGuard/
├── extension/          # Extensión del navegador original
├── frontend/           # Proyecto Angular
│   ├── src/
│   │   ├── app/       # Componentes y servicios de Angular
│   │   ├── assets/    # Imágenes, iconos, etc.
│   │   └── environments/
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
└── backend/           # API Node.js/Express
    ├── src/
    │   ├── models/    # Modelos Mongoose
    │   ├── routes/    # Rutas de API
    │   ├── controllers/
    │   ├── middleware/
    │   ├── config/    # Configuración (BD, etc)
    │   └── index.js   # Servidor principal
    ├── package.json
    └── .env.example
```

## Instalación

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Próximos Pasos
- [ ] Crear modelos de usuario (Mongoose)
- [ ] Implementar autenticación (JWT)
- [ ] Crear landing page en Angular
- [ ] Formulario de registro
- [ ] Conexión API Frontend-Backend
