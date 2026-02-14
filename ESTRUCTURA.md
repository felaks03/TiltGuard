# Estructura del Proyecto TiltGuard

## 📁 Organización del Frontend (Angular)

```
frontend/src/app/
├── admin/                          # Panel de Administración
│   ├── admin.component.ts         # Componente principal
│   ├── admin.component.html       # Template
│   ├── admin.component.scss       # Estilos
│   ├── admin.module.ts            # Módulo
│   └── admin.service.ts           # Servicio
│
├── user/                           # Componentes de Usuario
│   ├── user.component.ts          # Componente principal
│   ├── user.component.html        # Template
│   ├── user.component.scss        # Estilos
│   ├── user.module.ts             # Módulo
│   ├── user.service.ts            # Servicio (API)
│   └── (futuros: perfil, configuración, etc.)
│
├── pages/                          # Componentes Compartidos
│   ├── header/                     # Encabezado
│   │   ├── header.component.ts
│   │   ├── header.component.html
│   │   ├── header.component.scss
│   │   ├── header.module.ts
│   │   └── header.service.ts
│   │
│   └── sidebar/                    # Barra Lateral
│       ├── sidebar.component.ts
│       ├── sidebar.component.html
│       ├── sidebar.component.scss
│       ├── sidebar.module.ts
│       └── sidebar.service.ts
│
├── app.component.ts               # Componente Raíz
├── app.component.html             # Layout Principal
├── app.component.scss             # Estilos Globales
├── app.routes.ts                  # Definición de Rutas
├── app.config.ts                  # Configuración (Providers)
│
├── assets/                         # Recursos Estáticos
│   └── icons/                      # Iconos
│
└── environments/                   # Variables por Entorno

```

## 🔄 Flujo de Componentes

```
app.component.ts (Raíz)
├── header (Siempre visible)
├── sidebar (Siempre visible)
└── router-outlet (Contenido dinámico)
    ├── /admin -> admin.component
    ├── /usuarios -> user.component
    └── /user -> user.component (alias)
```

## 🔀 Sistema de Rutas

| Ruta | Componente | Rol |
|------|-----------|-----|
| `/` | → `/usuarios` | Todos |
| `/usuarios` | `user.component` | Admin/Usuario |
| `/user` | `user.component` | Admin/Usuario |
| `/admin` | `admin.component` | Admin |

## 📦 Servicios Principales

### UserService (`user/user.service.ts`)
- Conecta con `/api/usuarios`
- Métodos: `obtenerTodos()`, `obtenerPorId()`, `crear()`, `actualizar()`, `eliminar()`

### HeaderService (`pages/header/header.service.ts`)
- Manejo del encabezado

### SidebarService (`pages/sidebar/sidebar.service.ts`)
- Manejo de navegación

## 🎯 Próximas Estructuras a Implementar

```
user/
├── profile/           # Perfil de usuario
├── settings/          # Configuración
└── dashboard/         # Panel de usuario

admin/
├── users/             # Gestión de usuarios
├── reports/           # Reportes
└── settings/          # Configuración del sistema
```

## 📝 Convenciones

- **Componentes Standalone**: Todos los componentes usan `standalone: true`
- **Inyección**: Usar `inject()` en lugar de `constructor()`
- **Rutas Lazy Loading**: Los componentes se cargan bajo demanda
- **Servicios**: Inyectar con `providedIn: 'root'`

## ✅ Checklist de Estructura

- [x] Carpeta `admin/` creada
- [x] Carpeta `user/` creada
- [x] Carpeta `pages/` creada
- [x] Header movido a `pages/`
- [x] Sidebar movido a `pages/`
- [x] Importaciones actualizadas
- [x] README actualizado
- [x] Esta documentación creada
