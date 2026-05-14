# 📱 Galindo Anime - PWA para Android

He configurado tu sitio como una **Progressive Web App (PWA)** para que puedas instalarlo como una app nativa en Android.

## 🚀 Inicio Rápido

### 1. Generar Iconos (Paso Crítico ⚠️)

```bash
npm install
npm run generate-icons
```

Esto creará los archivos PNG necesarios en `public/icons/`.

### 2. Compilar la Aplicación

```bash
npm run build
```

### 3. Desplegar a Producción

- Sube los archivos a un servidor con **HTTPS**
- Asegúrate de que `/public` sea accesible

### 4. Instalar en Android

1. Abre Chrome en Android
2. Ve a tu URL (ej: `https://tudominio.com`)
3. Espera 2-3 segundos
4. Toca "Instalar app"
5. ¡Listo!

## 📋 Archivos Creados

```
public/
├── manifest.json          → Configuración de la PWA
├── sw.js                 → Service Worker (caché offline)
├── sw-register.js        → Script para registrar el SW
├── pwa-checker.html      → Verificador de setup
└── icons/
    ├── icon-192x192.svg  → Fuente del ícono (mantener)
    ├── icon-192x192.png  → Ícono pequeño (generar)
    ├── icon-512x512.png  → Ícono grande (generar)
    └── icon-maskable-*.png → Ícono adaptable (generar)

index.html                 → Actualizado con manifest y meta tags
package.json              → Incluye "generate-icons" script
```

## ✨ Características PWA

✅ **Instalar como App** - Acceso directo desde la pantalla de inicio  
✅ **Funciona Offline** - Caché inteligente con Service Worker  
✅ **Más Rápida** - Carga más rápido que el navegador  
✅ **Favoritos Sincronizados** - Se guardan localmente en el dispositivo  
✅ **Sin Límites de Navegador** - A pantalla completa  
✅ **Push Notifications** - Posibilidad de notificaciones (futuro)

## 🔍 Verificar Setup

### Opción 1: Herramienta Integrada
Abre `public/pwa-checker.html` (o `https://tudominio.com/pwa-checker.html` en producción) para un checklist interactivo.

### Opción 2: DevTools Manual (Desktop)
1. F12 → DevTools
2. **Application** → **Manifest**: Debe cargar sin errores
3. **Application** → **Service Workers**: Debe estar "Active"

### Opción 3: Chrome Mobile
1. ⋮ (Menú) → **Información de la app** → **Avanzado**
2. Busca "Manifest" o abre DevTools

## 📚 Documentación Detallada

- **[PWA_SETUP.md](PWA_SETUP.md)** - Guía completa de setup
- **[INSTALL_PWA.md](INSTALL_PWA.md)** - Instrucciones para usuarios
- **[GENERATE_ICONS.md](GENERATE_ICONS.md)** - Cómo generar iconos

## 🆘 Troubleshooting

### "No veo la opción de instalar"
```bash
# Checklist:
- [ ] URL es HTTPS
- [ ] Esperé 2-3 segundos
- [ ] Manifest.json es válido
- [ ] Service Worker está activo
```

### "El Service Worker no se registra"
```javascript
// Abre DevTools y corre esto:
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registraciones:', regs);
  regs.forEach(r => r.unregister());
});
// Luego recarga la página
```

### "Los iconos no aparecen"
```bash
# Asegúrate de ejecutar:
npm run generate-icons

# Verifica que existan:
ls -la public/icons/icon-*.png
```

## 🎯 Pasos Siguientes

1. ✅ Ejecuta `npm run generate-icons`
2. ✅ Ejecuta `npm run build`
3. ✅ Despliega en HTTPS
4. ✅ Prueba en Android
5. ✅ ¡Disfruta tu app! 🚀

## 💡 Pro Tips

- Los usuarios pueden añadir atajos a la pantalla de inicio desde el menú de Chrome
- La app funciona offline si ha sido visitada antes
- Los favoritos se guardan localmente (no necesita conexión)
- Puedes actualizar la app sin perder datos de usuarios

## 📞 Soporte

Si tienes problemas:
1. Abre DevTools (F12)
2. Ve a **Console** y busca errores
3. Abre **Application** → **Manifest** para validar
4. Revisa **Application** → **Service Workers**

---

¡Tu PWA está lista! 🎬📱
