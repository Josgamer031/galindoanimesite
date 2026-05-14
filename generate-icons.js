#!/usr/bin/env node

/**
 * Script para generar iconos PNG desde SVG
 * 
 * Instalación de dependencias:
 * npm install canvas
 * 
 * Ejecución:
 * node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Intenta usar sharp si está disponible, si no usa canvas
let generateIcon;

try {
  const sharp = require('sharp');
  
  generateIcon = async (svgPath, outputPath, size) => {
    try {
      await sharp(svgPath)
        .resize(size, size, { fit: 'contain', background: { r: 20, g: 21, b: 25, alpha: 1 } })
        .png()
        .toFile(outputPath);
      console.log(`✅ Generado: ${outputPath}`);
    } catch (err) {
      console.error(`❌ Error generando ${outputPath}:`, err.message);
    }
  };
  
} catch {
  // Usar Canvas como fallback
  try {
    const { createCanvas, loadImage } = require('canvas');
    
    generateIcon = async (svgPath, outputPath, size) => {
      try {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Fondo
        ctx.fillStyle = '#141519';
        ctx.fillRect(0, 0, size, size);
        
        // Gradiente y letra G
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#F47521');
        gradient.addColorStop(1, '#FF9257');
        
        const margin = size * 0.135;
        ctx.fillStyle = gradient;
        ctx.fillRect(margin, margin, size - margin * 2, size - margin * 2);
        
        // Letra G
        ctx.fillStyle = 'white';
        ctx.font = `bold ${size * 0.47}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('G', size / 2, size / 2);
        
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Generado: ${outputPath}`);
      } catch (err) {
        console.error(`❌ Error generando ${outputPath}:`, err.message);
      }
    };
  } catch {
    console.error('❌ Instala "sharp" o "canvas" para generar iconos:');
    console.error('   npm install sharp');
    process.exit(1);
  }
}

async function main() {
  const iconDir = path.join(__dirname, 'public', 'icons');
  
  // Crear directorio si no existe
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
    console.log(`📁 Directorio creado: ${iconDir}`);
  }
  
  const svgFile = path.join(iconDir, 'icon-192x192.svg');
  
  // Verificar que el SVG existe
  if (!fs.existsSync(svgFile)) {
    console.error(`❌ No encontrado: ${svgFile}`);
    process.exit(1);
  }
  
  console.log('🎨 Generando iconos...\n');
  
  const sizes = [
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' },
    { size: 192, name: 'icon-maskable-192x192.png' },
    { size: 512, name: 'icon-maskable-512x512.png' },
  ];
  
  for (const { size, name } of sizes) {
    const outputPath = path.join(iconDir, name);
    await generateIcon(svgFile, outputPath, size);
  }
  
  console.log('\n✅ ¡Todos los iconos han sido generados exitosamente!');
  console.log('   La app PWA está lista para instalar en Android.');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
