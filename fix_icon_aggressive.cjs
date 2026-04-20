const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function fixIconTransparency() {
  try {
    const inputPath = path.join(__dirname, 'build', 'icon.png');
    console.log('Reading icon from:', inputPath);
    const image = await Jimp.read(inputPath);
    
    // 1. Jimp images are RGBA by default in the bitmap.data buffer.
    // 2. Aggressive Background Removal
    // We'll create a circular mask to keep only the central graphic
    // Most app icons are centered.
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = (Math.min(width, height) / 2) - 4; // Leave 4px edge safety

    image.scan(0, 0, width, height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // Calculate distance from center
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      // If outside the circle OR very close to white
      if (dist > radius || (r > 240 && g > 240 && b > 240)) {
        this.bitmap.data[idx + 3] = 0; // Transparent
      }
    });

    await image.write(inputPath);
    console.log('Aggressive transparency fix applied to build/icon.png');

  } catch (err) {
    console.error('Error fixing icon transparency:', err);
  }
}

fixIconTransparency();
