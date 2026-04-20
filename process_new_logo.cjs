const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function processNewLogo() {
  try {
    const generatedPath = "C:\\Users\\Pasindu\\.gemini\\antigravity\\brain\\482da979-5e31-4c05-8472-5242e176132d\\bill_studio_minimal_icon_v5_1776676712359.png";
    const outputPath = path.join(__dirname, 'build', 'icon.png');
    
    console.log('Reading generated logo from:', generatedPath);
    const image = await Jimp.read(generatedPath);
    
    // 1. Zoom and Trim (Autocrop)
    // We use a small border (2px) to make sure it fills the canvas as requested.
    image.autocrop({ leaveBorder: 2 });

    // 2. Remove Gray Background
    // We scan for shades of gray. Neutral gray is usually balanced R ~= G ~= B.
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // If it's very close to a neutral gray (e.g., 120-140 range and balanced)
      // OR if it's way out at the corners (background)
      const isGray = (Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && r > 100 && r < 160);
      
      // Better: Since the background is "solid, neutral gray", we can pick the top-left pixel as reference
      // but scanning for gray is safer.
      if (isGray) {
        this.bitmap.data[idx + 3] = 0;
      }
    });

    // 3. Final Resize to 256x256
    image.contain({ w: 256, h: 256 });

    await image.write(outputPath);
    console.log('Processed logo saved to build/icon.png');

  } catch (err) {
    console.error('Error processing logo:', err);
  }
}

processNewLogo();
