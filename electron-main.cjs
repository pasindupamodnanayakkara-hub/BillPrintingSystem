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
  const scope = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ].join(' ');

  // Silent Auth stays in internal window to avoid popping browser
  if (silent) {
    const redirectUri = 'http://localhost/';
    let authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scope)}` +
      `&prompt=none`;

    if (mainWindow) mainWindow.webContents.send('oauth-debug', { type: 'silent', url: authUrl, redirectUri });

    return new Promise((resolve, reject) => {
      const authWin = new BrowserWindow({
        width: 500,
        height: 650,
        parent: mainWindow,
        show: false,
        autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      });
      authWin.loadURL(authUrl);
      const handleNav = (url) => {
        if (url.startsWith(redirectUri)) {
          const fragment = new URL(url.replace('#', '?')).searchParams;
          const token = fragment.get('access_token');
          authWin.destroy();
          if (token) resolve(token);
          else reject(new Error('Silent auth failed'));
        }
      };
      authWin.webContents.on('will-redirect', (e, url) => handleNav(url));
      authWin.webContents.on('will-navigate', (e, url) => handleNav(url));
      setTimeout(() => { if (!authWin.isDestroyed()) { authWin.destroy(); reject(new Error('Timeout')); } }, 10000);
    });
  }

  // Interactive Auth: Use System Browser with Loopback Server
  return new Promise((resolve, reject) => {
    const http = require('http');
    const port = 4567;
    const redirectUri = `http://localhost:${port}/`;
    
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      
      // Phase 1: Browser reaches localhost with #hash in URL
      if (url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; margin: 0;">
              <div style="background: white; padding: 2rem; border-radius: 1rem; shadow: 0 10px 15px -3px rgba(0,0,0,0.1); text-align: center;">
                <h2 style="color: #111827; margin: 0;">Connecting to Bill Studio...</h2>
                <p style="color: #6b7280;">You can close this window now.</p>
                <script>
                  const fragment = new URLSearchParams(window.location.hash.substring(1));
                  const token = fragment.get('access_token');
                  const error = fragment.get('error');
                  if (token || error) {
                    fetch('/callback?' + fragment.toString()).then(() => window.close());
                  }
                </script>
              </div>
            </body>
          </html>
        `);
        return;
      }

      // Phase 2: JS in browser Sends results back to server via query string
      if (url.pathname === '/callback') {
        const token = url.searchParams.get('access_token');
        const error = url.searchParams.get('error');
        
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        res.end('Authentication complete. You can close this tab.');
        
        server.close();
        if (token) resolve(token);
        else reject(new Error(error || 'OAuth cancelled'));
      }
    });

    server.listen(port, () => {
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent(scope)}` +
        `&prompt=select_account`;
      
      if (mainWindow) mainWindow.webContents.send('oauth-debug', { type: 'interactive', url: authUrl, redirectUri });
      shell.openExternal(authUrl);
    });

    server.on('error', (err) => {
      reject(err);
    });
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

ipcMain.handle('print-to-pdf', async (event, { filename }) => {
  const suggestedName = filename ? `${filename}.pdf` : `Invoice_${Date.now()}.pdf`;
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Invoice as PDF',
    defaultPath: path.join(app.getPath('documents'), suggestedName),
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
