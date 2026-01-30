const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Try to load .env if available (dev mode)
try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (e) {
  // dotenv not available in production build, ignore
}

// Determine where to store data.
// In development: app directory.
// In production (exe): Next to the executable.
const DATA_FILE_NAME = 'donnees-comptes.json';
const userDataPath = app.isPackaged
  ? path.dirname(app.getPath('exe'))
  : app.getAppPath();
const dataFilePath = path.join(userDataPath, DATA_FILE_NAME);

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Needed for some local setups, handle with care in prod
    },
    autoHideMenuBar: true,
  });

  // Load the index.html
  const indexPath = app.isPackaged
    ? path.join(__dirname, 'dist', 'index.html')
    : path.join(__dirname, 'index.html');
  mainWindow.loadFile(indexPath);

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// --- IPC Handlers ---

ipcMain.handle('save-data', async (event, encodedData) => {
  try {
    // Les données arrivent déjà encodées en base64 depuis le renderer
    await fs.writeFile(dataFilePath, encodedData, 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving data:', err);
    return false;
  }
});

ipcMain.handle('load-data', async () => {
  try {
    // Retourne directement les données encodées en base64
    const encodedData = await fs.readFile(dataFilePath, 'utf-8');
    return encodedData;
  } catch (err) {
    // If file doesn't exist, return null
    if (err.code === 'ENOENT') return null;
    console.error('Error loading data:', err);
    return null;
  }
});

ipcMain.handle('get-api-key', () => {
  return process.env.API_KEY || '';
});

// --- App Lifecycle ---

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
