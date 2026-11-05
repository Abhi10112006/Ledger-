const fs = require('fs');

const buf = fs.readFileSync('public/app_logo.png');
const base64 = 'data:image/png;base64,' + buf.toString('base64');

const content = `/**
 * Pre-compiled Base64 and SVG vector data for the official "L" logo.
 * Generated automatically from the master SVG to ensure zero load latency.
 */
export const L_LOGO_BASE64 = ${JSON.stringify(base64)};

export const L_LOGO_SVG = \`<svg viewBox="0 0 100 100" width="100" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <rect width="100" height="100" rx="24" fill="url(#lgBg)" />
  <rect width="100" height="100" rx="24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
  <rect x="27" y="24" width="14" height="52" rx="5" fill="url(#lgAccent)" />
  <rect x="27" y="62" width="46" height="14" rx="5" fill="url(#lgAccent)" />
  <circle cx="73" cy="27" r="5" fill="#10b981" opacity="0.6" />
</svg>\`;
`;

fs.writeFileSync('utils/logoData.ts', content);
console.log('utils/logoData.ts written successfully!');
