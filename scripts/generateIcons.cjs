const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Exact SVG from components/Logo.tsx
const createSvg = (size, round = false) => `
<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lgAccent" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.7" />
    </linearGradient>
    <linearGradient id="lgBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1C1C1E" />
      <stop offset="100%" stop-color="#141416" />
    </linearGradient>
  </defs>

  <!-- Background: rounded or circle for round icons -->
  ${round 
    ? '<circle cx="50" cy="50" r="48" fill="url(#lgBg)" />' 
    : '<rect width="100" height="100" rx="24" fill="url(#lgBg)" />'}

  <!-- Subtle inner border -->
  ${round 
    ? '<circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />' 
    : '<rect width="100" height="100" rx="24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />'}

  <!-- Bold "L" mark — vertical bar -->
  <rect x="27" y="24" width="14" height="52" rx="5" fill="url(#lgAccent)" />

  <!-- Horizontal bar of L -->
  <rect x="27" y="62" width="46" height="14" rx="5" fill="url(#lgAccent)" />

  <!-- Accent dot — top right -->
  <circle cx="73" cy="27" r="5" fill="#10b981" opacity="0.6" />
</svg>
`;

const createForegroundSvg = (size) => `
<svg viewBox="0 0 108 108" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lgAccentFg" x1="0" y1="0" x2="108" y2="108" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.75" />
    </linearGradient>
  </defs>

  <g transform="translate(19, 19) scale(0.7)">
    <rect width="100" height="100" rx="24" fill="#18181b" />
    <rect width="100" height="100" rx="24" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
    <rect x="27" y="24" width="14" height="52" rx="5" fill="url(#lgAccentFg)" />
    <rect x="27" y="62" width="46" height="14" rx="5" fill="url(#lgAccentFg)" />
    <circle cx="73" cy="27" r="5" fill="#10b981" opacity="0.8" />
  </g>
</svg>
`;

async function run() {
  console.log("Generating uniform 'L' icons and splashes...");

  // 1. Master PNGs
  const svg1024 = createSvg(1024);
  const buf1024 = await sharp(Buffer.from(svg1024)).png().toBuffer();
  fs.writeFileSync('assets/icon.png', buf1024);
  fs.writeFileSync('assets/logo.png', buf1024);

  const svg512 = createSvg(512);
  const buf512 = await sharp(Buffer.from(svg512)).png().toBuffer();
  fs.writeFileSync('public/app_logo.png', buf512);
  fs.writeFileSync('public/favicon.png', buf512);
  if (fs.existsSync('dist')) {
    fs.writeFileSync('dist/app_logo.png', buf512);
    fs.writeFileSync('dist/favicon.png', buf512);
  }

  // 2. Web icons
  const iconSizes = [48, 72, 96, 128, 192, 256, 512];
  for (const sz of iconSizes) {
    const webpBuf = await sharp(Buffer.from(createSvg(sz))).webp().toBuffer();
    fs.writeFileSync(`icons/icon-${sz}.webp`, webpBuf);
  }

  // 3. Android Mipmaps
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const m of mipmaps) {
    const targetDir = path.join('android', 'app', 'src', 'main', 'res', m.dir);
    if (!fs.existsSync(targetDir)) continue;

    const iconBuf = await sharp(Buffer.from(createSvg(m.size))).webp().toBuffer();
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.webp'), iconBuf);

    const roundBuf = await sharp(Buffer.from(createSvg(m.size, true))).webp().toBuffer();
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.webp'), roundBuf);

    const fgSize = Math.round(m.size * (108 / 48));
    const fgBuf = await sharp(Buffer.from(createForegroundSvg(fgSize))).webp().toBuffer();
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.webp'), fgBuf);
  }

  // 4. Update Android Splash Screens
  const resDir = path.join('android', 'app', 'src', 'main', 'res');
  const drawables = fs.readdirSync(resDir).filter(d => d.startsWith('drawable'));

  for (const d of drawables) {
    const splashPath = path.join(resDir, d, 'splash.png');
    if (fs.existsSync(splashPath)) {
      try {
        const meta = await sharp(splashPath).metadata();
        const w = meta.width || 480;
        const h = meta.height || 800;
        const logoDimension = Math.min(Math.round(Math.min(w, h) * 0.35), 240);

        const logoBuf = await sharp(Buffer.from(createSvg(logoDimension))).png().toBuffer();

        // Overlay centered on #141416 dark background
        const newSplash = await sharp({
          create: {
            width: w,
            height: h,
            channels: 4,
            background: { r: 20, g: 20, b: 22, alpha: 1 }
          }
        })
        .composite([{ input: logoBuf, gravity: 'centre' }])
        .png()
        .toBuffer();

        fs.writeFileSync(splashPath, newSplash);
      } catch (e) {
        console.warn('Could not update splash for', d, e.message);
      }
    }
  }

  console.log("All icons and splash screens successfully generated with the new 'L' logo!");
}

run().catch(err => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
