# TiltGuard - Tradovate Blocker

Extensión de Chrome para bloquear elementos específicos en Tradovate.com

## Instalación

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa "Modo de desarrollador" (esquina superior derecha)
3. Haz clic en "Cargar extensión sin empaquetar"
4. Selecciona la carpeta `extension`

## Funcionalidades

- Bloquea el elemento "Risk Settings" en Tradovate
- Toggle en el popup para activar/desactivar el bloqueo
- Sincronización automática entre pestañas

## Estructura

```
extension/
├── manifest.json
├── README.md
└── src/
    ├── scripts/
    │   ├── background.js
    │   ├── content.js
    │   ├── popup.js
    │   └── options.js
    ├── pages/
    │   ├── popup.html
    │   └── options.html
    ├── styles/
    │   ├── popup.css
    │   └── options.css
    └── assets/
        └── icons/
```
