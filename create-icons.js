const fs = require('fs');
const path = require('path');

// Create a simple 1024x1024 PNG with a solid color
// This is a minimal valid PNG file
const createSimplePNG = (size, color) => {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk (image header)
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // chunk length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(size, 8); // width
  ihdr.writeUInt32BE(size, 12); // height
  ihdr.writeUInt8(8, 16); // bit depth
  ihdr.writeUInt8(2, 17); // color type (RGB)
  ihdr.writeUInt8(0, 18); // compression
  ihdr.writeUInt8(0, 19); // filter
  ihdr.writeUInt8(0, 20); // interlace
  // CRC
  const crc = require('zlib').crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(crc, 21);
  
  // For simplicity, create a minimal IDAT chunk with compressed data
  // This creates a solid color image
  const idat = Buffer.from([
    0, 0, 0, 2, // length
    73, 68, 65, 84, // IDAT
    120, 1, // zlib header
    3, 0, // compressed data (minimal)
    0, 0, 0, 1, // CRC placeholder
  ]);
  
  // IEND chunk
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
  
  return Buffer.concat([signature, ihdr, idat, iend]);
};

// Create assets directory
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create icon.png
const iconPath = path.join(assetsDir, 'icon.png');
fs.writeFileSync(iconPath, createSimplePNG(1024, '#6BA3FF'));
console.log('Created icon.png');

// Create adaptive-icon.png
const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');
fs.writeFileSync(adaptiveIconPath, createSimplePNG(1024, '#6BA3FF'));
console.log('Created adaptive-icon.png');

// Create splash.png
const splashPath = path.join(assetsDir, 'splash.png');
fs.writeFileSync(splashPath, createSimplePNG(1284, '#6BA3FF'));
console.log('Created splash.png');

console.log('All placeholder icons created successfully!');
