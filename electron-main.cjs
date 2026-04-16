const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#111827',
      symbolColor: '#9ca3af',
      height: 40
    }
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => (mainWindow = null));
}

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.restore();
    else mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// ─── Google OAuth IPC Handler ────────────────────────────────────────────────
ipcMain.handle('google-oauth', async (event, { clientId, silent = false }) => {
  const redirectUri = 'http://localhost';
  const scope = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ].join(' ');

  let authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(scope)}`;
    
  if (silent) {
    authUrl += `&prompt=none`;
  } else {
    authUrl += `&prompt=select_account`;
  }

  return new Promise((resolve, reject) => {
    const authWin = new BrowserWindow({
      width: 500,
      height: 650,
      parent: mainWindow,
      modal: !silent,
      show: !silent,
      autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    authWin.loadURL(authUrl);

    // Watch every URL change for the redirect with access_token
    const handleNav = (url) => {
      if (url.startsWith(redirectUri)) {
        const fragment = new URL(url.replace('#', '?')).searchParams;
        const token = fragment.get('access_token');
        const error = fragment.get('error');
        authWin.destroy();
        if (token) resolve(token);
        else reject(new Error(error || 'OAuth cancelled'));
      }
    };

    authWin.webContents.on('will-redirect', (e, url) => handleNav(url));
    authWin.webContents.on('will-navigate', (e, url) => handleNav(url));
    authWin.on('closed', () => reject(new Error('Window closed by user')));
    
    if (silent) {
      // If silent, give it a few seconds to redirect. If it doesn't, it means interaction is required.
      setTimeout(() => {
        if (!authWin.isDestroyed()) {
          authWin.destroy();
          reject(new Error('Silent auth failed, interaction required.'));
        }
      }, 5000);
    }
  });
});
// ──────────────────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  // Configure Auto Updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  
  // Check for updates over the network
  autoUpdater.checkForUpdatesAndNotify();

  ipcMain.on('start-download', () => {
    autoUpdater.downloadUpdate();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Auto-Updater Events (IPC to React)
autoUpdater.on('checking-for-update', () => {
  if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'update-available', info });
});

autoUpdater.on('update-not-available', (info) => {
  if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'update-not-available', info });
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'download-progress', progress: progressObj });
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'update-downloaded', info });
});

autoUpdater.on('error', (err) => {
  if (mainWindow) mainWindow.webContents.send('updater-event', { type: 'error', error: err == null ? "unknown" : (err.message || err.toString()) });
});

ipcMain.handle('print-to-pdf', async (event) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Invoice as PDF',
    defaultPath: path.join(app.getPath('documents'), `Invoice_${Date.now()}.pdf`),
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });

  if (!filePath) return false;

  try {
    const data = await mainWindow.webContents.printToPDF({
      printBackground: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      pageSize: 'A4'
    });
    const fs = require('fs');
    fs.writeFileSync(filePath, data);
    return true;
  } catch (error) {
    console.error('Failed to save PDF:', error);
    return false;
  }
});

ipcMain.handle('print-window', async (event) => {
  return new Promise((resolve) => {
    mainWindow.webContents.print({ silent: false, printBackground: true }, (success, errorType) => {
      if (!success && errorType) console.error('Print failed:', errorType);
      resolve(success);
    });
  });
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall(true, true);
});
