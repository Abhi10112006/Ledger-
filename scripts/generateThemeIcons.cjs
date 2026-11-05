const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const THEMES = {
  emerald: '#10b981',
  violet: '#8b5cf6',
  blue: '#3b82f6',
  rose: '#f43f5e',
  amber: '#f59e0b',
  tokyo: '#ec4899',
  aurora: '#06b6d4',
  carbon: '#94a3b8'
};

const createSvg = (size, hexColor, round = false) => `
<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lgAccent" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${hexColor}" stop-opacity="0.95" />
      <stop offset="100%" stop-color="${hexColor}" stop-opacity="0.75" />
    </linearGradient>
    <linearGradient id="lgBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1C1C1E" />
      <stop offset="100%" stop-color="#141416" />
    </linearGradient>
  </defs>

  ${round 
    ? '<circle cx="50" cy="50" r="48" fill="url(#lgBg)" />' 
    : '<rect width="100" height="100" rx="24" fill="url(#lgBg)" />'}

  ${round 
    ? '<circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />' 
    : '<rect width="100" height="100" rx="24" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />'}

  <!-- Bold "L" mark -->
  <rect x="27" y="24" width="14" height="52" rx="5" fill="url(#lgAccent)" />
  <rect x="27" y="62" width="46" height="14" rx="5" fill="url(#lgAccent)" />

  <!-- Accent dot -->
  <circle cx="73" cy="27" r="5" fill="${hexColor}" opacity="0.75" />
</svg>
`;

async function run() {
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const [themeKey, hex] of Object.entries(THEMES)) {
    console.log(`Generating theme launcher icons for ${themeKey} (${hex})...`);
    for (const m of mipmaps) {
      const targetDir = path.join('android', 'app', 'src', 'main', 'res', m.dir);
      if (!fs.existsSync(targetDir)) continue;

      const squareBuf = await sharp(Buffer.from(createSvg(m.size, hex, false))).webp().toBuffer();
      fs.writeFileSync(path.join(targetDir, `ic_launcher_${themeKey}.webp`), squareBuf);

      const roundBuf = await sharp(Buffer.from(createSvg(m.size, hex, true))).webp().toBuffer();
      fs.writeFileSync(path.join(targetDir, `ic_launcher_${themeKey}_round.webp`), roundBuf);
    }
  }

  console.log("All theme icons generated successfully!");
}

run().catch(console.error);
