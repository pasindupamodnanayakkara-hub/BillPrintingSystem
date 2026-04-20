const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function transparentize() {
  try {
    const inputPath = path.join(__dirname, 'build', 'icon.png');
    console.log('Reading icon from:', inputPath);
    const image = await Jimp.read(inputPath);
    
    // Scan pixels and make white/near-white transparent
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If it's pure white or very close to white
      if (r > 245 && g > 245 && b > 245) {
        this.bitmap.data[idx + 3] = 0; // Alpha = 0
      }
    });

    await image.write(inputPath);
    console.log('Icon background removed and saved to build/icon.png');

  } catch (err) {
    console.error('Error processing transparency:', err);
  }
}

transparentize();
