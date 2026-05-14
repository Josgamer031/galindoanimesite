# 📦 Generando Iconos para PWA

Este archivo te ayuda a generar los archivos PNG necesarios para que la PWA funcione correctamente en Android.

## Opción 1: Usar ImageMagick (Recomendado)

Si tienes **ImageMagick** instalado, ejecuta estos comandos:

```bash
# Crear directorio si no existe
mkdir -p public/icons

# Generar iconos de 192x192
magick convert -background none public/icons/icon-192x192.svg -resize 192x192 public/icons/icon-192x192.png

# Generar iconos de 512x512
magick convert -background none public/icons/icon-192x192.svg -resize 512x512 public/icons/icon-512x512.png

# Generar maskable icons
magick convert -background none public/icons/icon-192x192.svg -resize 192x192 public/icons/icon-maskable-192x192.png
magick convert -background none public/icons/icon-192x192.svg -resize 512x512 public/icons/icon-maskable-512x512.png
```

## Opción 2: Usar Inkscape

1. Abre `public/icons/icon-192x192.svg` en Inkscape
2. Ve a **Archivo** → **Exportar como**
3. Selecciona formato **PNG**
4. Cambia tamaño a **192x192**
5. Haz clic en **Exportar**
6. Repite para 512x512

## Opción 3: Usar Online (Más Fácil)

1. Ve a https://www.svgtopng.com/
2. Sube `public/icons/icon-192x192.svg`
3. Selecciona tamaño **192x192** y descarga
4. Repite para **512x512**

## Opción 4: Usar Canvas (Node.js)

Instala las dependencias:
```bash
npm install sharp
```

Crea `scripts/generate-icons.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');

const svgFile = 'public/icons/icon-192x192.svg';

// Generate 192x192
sharp(svgFile)
  .resize(192, 192)
  .png()
  .toFile('public/icons/icon-192x192.png');

// Generate 512x512
sharp(svgFile)
  .resize(512, 512)
  .png()
  .toFile('public/icons/icon-512x512.png');

console.log('✅ Iconos generados correctamente');
```

Ejecuta:
```bash
node scripts/generate-icons.js
```

## Estructura Final Esperada

```
public/
├── icons/
│   ├── icon-192x192.svg       (fuente)
│   ├── icon-192x192.png       ✅ Necesario
│   ├── icon-512x512.png       ✅ Necesario
│   ├── icon-maskable-192x192.png  ✅ Necesario
│   └── icon-maskable-512x512.png  ✅ Necesario
├── manifest.json
└── sw.js
```

## 📷 Alternativa Rápida: Usar Iconos SVG Directamente

Si no puedes generar PNG, actualiza `manifest.json`:

```json
"icons": [
  {
    "src": "/icons/icon-192x192.svg",
    "sizes": "any",
    "type": "image/svg+xml",
    "purpose": "any"
  }
]
```

⚠️ **Nota**: Algunos navegadores requieren PNG, así que es mejor generar los PNG.

## ✅ Verificar que Todo Funciona

1. Abre DevTools (F12)
2. Ve a **Aplicación** → **Manifest**
3. Verifica que todos los iconos carguen correctamente
4. Service Worker debe estar registrado bajo **Aplicación** → **Service Workers**

---

Una vez tengas los PNG, ¡la app estará lista para instalar en Android! 🚀
