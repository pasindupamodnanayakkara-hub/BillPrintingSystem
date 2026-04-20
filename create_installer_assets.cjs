const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function createInstallerAssets() {
  try {
    const sidebarSrc = "C:\\Users\\Pasindu\\.gemini\\antigravity\\brain\\482da979-5e31-4c05-8472-5242e176132d\\bill_studio_installer_sidebar_1776682866631.png";
    const headerSrc = "C:\\Users\\Pasindu\\.gemini\\antigravity\\brain\\482da979-5e31-4c05-8472-5242e176132d\\bill_studio_installer_header_1776682886978.png";
    
    // 1. Process Sidebar (164 x 314)
    console.log('Processing Sidebar...');
    const sidebar = await Jimp.read(sidebarSrc);
    sidebar.cover({ w: 164, h: 314 });
    await sidebar.write(path.join(__dirname, 'build', 'installerSidebar.bmp'));
    
    // 2. Process Header (150 x 57)
    console.log('Processing Header...');
    const header = await Jimp.read(headerSrc);
    header.cover({ w: 150, h: 57 });
    await header.write(path.join(__dirname, 'build', 'installerHeader.bmp'));

    console.log('Installer BMP assets created successfully in build/');

  } catch (err) {
    console.error('Error creating installer assets:', err);
  }
}

createInstallerAssets();
