const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.resolve(__dirname, '../public');

// Crisp vector SVG for MADECC GROUP
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="50%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="104" fill="url(#bgGrad)"/>
  <rect width="504" height="504" x="4" y="4" rx="100" fill="none" stroke="rgba(245, 158, 11, 0.2)" stroke-width="3"/>

  <!-- Blueprint Engineering Grid Accent -->
  <g opacity="0.12" stroke="#38bdf8" stroke-width="1.5">
    <line x1="64" y1="64" x2="448" y2="64"/>
    <line x1="64" y1="160" x2="448" y2="160"/>
    <line x1="64" y1="256" x2="448" y2="256"/>
    <line x1="64" y1="352" x2="448" y2="352"/>
    <line x1="64" y1="448" x2="448" y2="448"/>
    <line x1="64" y1="64" x2="64" y2="448"/>
    <line x1="160" y1="64" x2="160" y2="448"/>
    <line x1="256" y1="64" x2="256" y2="448"/>
    <line x1="352" y1="64" x2="352" y2="448"/>
    <line x1="448" y1="64" x2="448" y2="448"/>
    <!-- Diagonal architectural bracing lines -->
    <line x1="64" y1="448" x2="448" y2="64" stroke-dasharray="6 6"/>
    <line x1="64" y1="64" x2="448" y2="448" stroke-dasharray="6 6"/>
  </g>

  <!-- Architectural Pylon & Monogram 'M' -->
  <!-- Left Column Pillar -->
  <path d="M120 376 L120 176 L164 136 L164 376 Z" fill="url(#cyanGrad)"/>
  
  <!-- Right Column Pillar -->
  <path d="M348 136 L392 176 L392 376 L348 376 Z" fill="url(#cyanGrad)"/>

  <!-- Golden Center Vault & Chevron -->
  <path d="M164 136 L256 256 L348 136 L308 136 L256 206 L204 136 Z" fill="url(#goldGrad)" filter="url(#glow)"/>
  
  <!-- Central Truss Pyramid Base -->
  <polygon points="256,170 324,376 188,376" fill="url(#goldGrad)" opacity="0.95"/>
  <polygon points="256,220 302,376 210,376" fill="#0f172a"/>

  <!-- Foundation Beam -->
  <rect x="96" y="376" width="320" height="20" rx="4" fill="url(#goldGrad)"/>
  <rect x="112" y="402" width="288" height="8" rx="3" fill="#38bdf8" opacity="0.7"/>

  <!-- Compass / Star Crest Vertex -->
  <circle cx="256" cy="116" r="14" fill="#fde68a" filter="url(#glow)"/>
  <circle cx="256" cy="116" r="7" fill="#0f172a"/>

  <!-- Corner Engineering Marks -->
  <circle cx="48" cy="48" r="4" fill="#f59e0b" opacity="0.6"/>
  <circle cx="464" cy="48" r="4" fill="#f59e0b" opacity="0.6"/>
  <circle cx="48" cy="464" r="4" fill="#f59e0b" opacity="0.6"/>
  <circle cx="464" cy="464" r="4" fill="#f59e0b" opacity="0.6"/>
</svg>`;

async function main() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  console.log('✓ Created public/icon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Generate standard 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created public/pwa-192x192.png');

  // 3. Generate standard 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created public/pwa-512x512.png');

  // 4. Generate maskable 512x512 with safe-zone margin (15% padding)
  const innerSize = Math.round(512 * 0.72); // 368px inside 512px
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a solid background
    }
  })
    .composite([
      {
        input: innerBuffer,
        gravity: 'center'
      }
    ])
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created public/pwa-maskable-512x512.png');

  // 5. Generate apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created public/apple-touch-icon.png');
}

main().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
