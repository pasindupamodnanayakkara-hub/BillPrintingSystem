const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function processIcon() {
  try {
    const inputPath = path.join(__dirname, 'build', 'icon.png');
    
    // Convert to ICO for Windows installer
    const pngToIco = require('png-to-ico').default || require('png-to-ico');
    const buf = await pngToIco(inputPath);
    fs.writeFileSync(path.join(__dirname, 'build', 'icon.ico'), buf);
    console.log('ICO successfully created at build/icon.ico.');

    // Also copy to stylized for backup
    fs.copyFileSync(inputPath, path.join(__dirname, 'build', 'icon_stylized.png'));

  } catch (err) {
    console.error('Error processing icon:', err);
    process.exit(1);
  }
}

processIcon();
