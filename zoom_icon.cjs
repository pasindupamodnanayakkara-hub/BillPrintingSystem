const { Jimp } = require('jimp');
const path = require('path');

async function zoomIcon() {
  try {
    const inputPath = path.join(__dirname, 'build', 'icon.png');
    console.log('Reading icon from:', inputPath);
    const image = await Jimp.read(inputPath);
    
    // Auto-crop to remove empty space around the graphic
    // Jimp's autocrop identifies the bounding box of non-transparent/non-background pixels
    image.autocrop({ leaveBorder: 8 }); // Leave 8px margin for anti-aliasing safety
    
    // Resize back to 256x256 (canonical size for Electron build icons)
    // We use CONTAIN to make sure it fits if it was tall/wide
    image.contain({ w: 256, h: 256 });
    
    await image.write(inputPath);
    console.log('Icon graphic zoomed to fill space and saved to build/icon.png');

  } catch (err) {
    console.error('Error zooming icon:', err);
  }
}

zoomIcon();
