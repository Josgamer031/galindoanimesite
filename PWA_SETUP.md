# 📱 Guía Rápida: Instalación PWA en Android

## ⚡ Pasos para Completar la Configuración

### 1️⃣ Generar Iconos PNG

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Generar los iconos PNG necesarios
npm run generate-icons
```

Si tienes problemas, sigue las instrucciones en `GENERATE_ICONS.md`

### 2️⃣ Construir el Proyecto

```bash
npm run build
```

### 3️⃣ Desplegar a Producción

Asegúrate de que:
- ✅ La URL sea **HTTPS** (requerido para PWA)
- ✅ Los archivos en `/public` se sirvan correctamente
- ✅ El `service-worker` esté registrado

### 4️⃣ Instalar en Android

1. Abre **Chrome** en tu Android
2. Ve a tu URL (ej: `https://tudominio.com`)
3. Espera 2-3 segundos hasta que aparezca una notificación
4. Toca **"Instalar"** o **"Agregar a pantalla de inicio"**
5. ¡Listo! La app aparecerá en tu pantalla de inicio

## 📋 Checklist Predeployment

- [ ] Ejecuté `npm run generate-icons`
- [ ] Ejecuté `npm run build` sin errores
- [ ] Los archivos PNG están en `public/icons/`
- [ ] El sitio es accesible por HTTPS
- [ ] `public/manifest.json` está presente
- [ ] `public/sw.js` está presente
- [ ] `index.html` incluye el manifest

## 🔍 Verificar que PWA Funciona

### En Desktop (Chrome DevTools)
1. Abre **DevTools** (F12)
2. Ve a **Aplicación** → **Manifest**
3. Verifica que se cargue sin errores
4. Ve a **Application** → **Service Workers**
5. El service worker debe estar **Activado**

### En Android
1. Abre Chrome
2. Presiona el menú (⋮)
3. Selecciona **"Información de la app"** → **"Avanzado"**
4. Busca "Manifest" o abre DevTools

## 📂 Estructura Final

```
proyecto/
├── public/
│   ├── manifest.json          ✅ Configuración PWA
│   ├── sw.js                 ✅ Service Worker
│   ├── sw-register.js        ✅ Registro del SW
│   ├── icons/
│   │   ├── icon-192x192.svg  (fuente)
│   │   ├── icon-192x192.png  ✅ Requerido
│   │   ├── icon-512x512.png  ✅ Requerido
│   │   ├── icon-maskable-192x192.png
│   │   └── icon-maskable-512x512.png
│   └── images/
├── index.html                 ✅ Con manifest y sw-register
└── ... resto del proyecto
```

## 🆘 Problemas Comunes

**P: No veo la opción de instalar en Android**
- Asegúrate de usar HTTPS
- Espera 2-3 segundos después de cargar
- Intenta en modo incógnito
- Limpia el caché del navegador

**P: El Service Worker no se registra**
- Abre DevTools y ve a Aplicación → Service Workers
- Revisa la consola para errores
- Asegúrate que `sw.js` esté en `/public`

**P: Los iconos no aparecen**
- Ejecuta `npm run generate-icons`
- Verifica que los PNG estén en `public/icons/`
- Limpia el caché y recarga

## 📚 Más Información

- [MDN - Web App Manifest](https://developer.mozilla.org/es/docs/Web/Manifest)
- [MDN - Service Workers](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)
- [Google - Progressive Web Apps](https://developers.google.com/web/progressive-web-apps)

---

¡Listo! Tu app PWA está lista para Android 🚀
