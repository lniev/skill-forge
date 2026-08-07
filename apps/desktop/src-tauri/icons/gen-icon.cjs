const fs = require('fs');
const path = require('path');

const SIZE = 512;
const RADIUS = 96;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <!-- White background -->
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="#ffffff" />

  <!-- Cyan circle -->
  <circle cx="256" cy="256" r="160" fill="#00d4ff" />

  <!-- Abstract S letter, tilted -->
  <g transform="translate(256, 256) rotate(12) translate(-256, -256)">
    <path
      d="M180 170 H310 A40 40 0 0 1 350 210 V238 A40 40 0 0 1 310 278 H190 A40 40 0 0 0 150 318 V348 A40 40 0 0 0 190 388 H330"
      fill="none"
      stroke="#ffffff"
      stroke-width="34"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>`;

const out = path.join(__dirname, 'icon-source.svg');
fs.writeFileSync(out, svg);
console.log('Wrote', out);
