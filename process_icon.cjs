let pngToIco = require('png-to-ico');
if (pngToIco.default) pngToIco = pngToIco.default;
const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

async function processIcon() {
  try {
    const inputPath = path.join(__dirname, 'build', 'icon.png');
    const outputPath = path.join(__dirname, 'build', 'icon.ico');
    
    console.log('Normalizing icon with Jimp...');
    const image = await Jimp.read(inputPath);
    await image.resize({ w: 256, h: 256 });
    const pngBuffer = await image.getBuffer('image/png');
    
    console.log('Converting to ICO...');
    const buf = await pngToIco(pngBuffer);
    fs.writeFileSync(outputPath, buf);
    console.log('ICO successfully created at build/icon.ico.');

    // Also copy to stylized for backup
    fs.copyFileSync(inputPath, path.join(__dirname, 'build', 'icon_stylized.png'));

  } catch (err) {
    console.error('Error processing icon:', err);
    process.exit(1);
  }
}

processIcon();
