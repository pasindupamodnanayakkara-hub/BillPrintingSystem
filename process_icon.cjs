const { Jimp } = require('jimp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function processIcon() {
  try {
    const inputPath = path.join(__dirname, 'build', 'icon.png');
    
    // Read the image
    const image = await Jimp.read(inputPath);
    
    // Resize to a square standard for ICO
    image.resize(256, 256);
    
    // Scan all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red   = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue  = this.bitmap.data[idx + 2];
      const alpha = this.bitmap.data[idx + 3];

      // Replace pure/semi-white with "accent-gold" RGB(202, 138, 4)
      if (red > 200 && green > 200 && blue > 200 && alpha > 100) {
        this.bitmap.data[idx + 0] = 202; // R
        this.bitmap.data[idx + 1] = 138; // G
        this.bitmap.data[idx + 2] = 4;   // B
      }
      
      // Make dark grays a truly deep rich midnight black (system UI matches #000)
      if (red < 60 && green < 60 && blue < 60 && alpha > 100) {
        this.bitmap.data[idx + 0] = 10;
        this.bitmap.data[idx + 1] = 10;
        this.bitmap.data[idx + 2] = 10;
      }
    });

    const stylizedPng = path.join(__dirname, 'build', 'icon_stylized.png');
    await image.writeAsync(stylizedPng);
    console.log('Premium UI matching PNG successfully created at', stylizedPng);

    // Convert to ICO for Windows installer
    const buf = await pngToIco(stylizedPng);
    fs.writeFileSync(path.join(__dirname, 'build', 'icon.ico'), buf);
    console.log('ICO successfully created at build/icon.ico.');

  } catch (err) {
    console.error('Error processing icon:', err.message || err);
    process.exit(1);
  }
}

processIcon();
