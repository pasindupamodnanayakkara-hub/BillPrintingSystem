const { app, BrowserWindow, dialog, ipcMain } = require('electron');
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
    frame: false,
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

app.whenReady().then(() => {
  createWindow();

  // Configure Auto Updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  
  // Check for updates over the network
  autoUpdater.checkForUpdatesAndNotify();

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

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall(true, true);
});
