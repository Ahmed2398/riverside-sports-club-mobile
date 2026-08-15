const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Create a PNG with solid color
const createPNG = (width, height, r, g, b, a = 255) => {
  const png = new PNG({ width, height });
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
  
  return PNG.sync.write(png);
};

// Create assets directory
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Primary color: #6BA3FF (RGB: 107, 163, 255)
const r = 107, g = 163, b = 255;

// Create icon.png (1024x1024)
const iconPath = path.join(assetsDir, 'icon.png');
fs.writeFileSync(iconPath, createPNG(1024, 1024, r, g, b));
console.log('Created icon.png');

// Create adaptive-icon.png (1024x1024)
const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');
fs.writeFileSync(adaptiveIconPath, createPNG(1024, 1024, r, g, b));
console.log('Created adaptive-icon.png');

// Create splash.png (1284x2778 for iPhone X)
const splashPath = path.join(assetsDir, 'splash.png');
fs.writeFileSync(splashPath, createPNG(1284, 2778, r, g, b));
console.log('Created splash.png');

console.log('All app icons created successfully!');
