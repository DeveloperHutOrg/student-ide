import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from './db';
import { registerIpcHandlers } from './ipcHandlers';
import { stopActiveExecution } from './runner';
import { clearSession } from './sessionService';
import { logoutAdmin } from './adminAuthService';

// Ensure consistent application name and userData directory in dev and production
app.name = 'student-ide';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../../build/icon.ico')
    : path.join(__dirname, '../../build/icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'Student IDE',
    backgroundColor: '#1e1e2e',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Hide default menu bar for clean modern IDE look
  mainWindow.setMenuBarVisibility(false);

  // Debug logging
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Renderer finished loading successfully');
  });

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('[Main] Renderer failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (event) => {
    console.log(`[Renderer] [${event.level}] ${event.message} (${event.sourceId}:${event.lineNumber})`);
  });

  const isDev = process.argv.includes('--dev') || !!process.env.VITE_DEV_SERVER_URL;
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || (isDev ? 'http://localhost:5173' : undefined);
  if (devServerUrl) {
    console.log('[Main] Loading dev server URL:', devServerUrl);
    mainWindow.loadURL(devServerUrl);
  } else {
    const indexPath = path.join(__dirname, '../../dist/index.html');
    console.log('[Main] Loading production index file:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.center();
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  setTimeout(() => {
    mainWindow?.setAlwaysOnTop(false);
  }, 1000);

  // Automatic logout & process cleanup when window closes (Close button, Alt+F4)
  mainWindow.on('close', () => {
    performShutdownCleanup();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function performShutdownCleanup(): void {
  try {
    // 1. Terminate running student code execution process tree
    stopActiveExecution(mainWindow);
  } catch (err) {
    console.warn('[Shutdown] Error stopping active execution:', err);
  }

  try {
    // 2. Clear student session
    clearSession();
    // 3. Clear admin authentication session
    logoutAdmin();
  } catch (err) {
    console.warn('[Shutdown] Error clearing session:', err);
  }

  try {
    // 4. Safely flush and close database
    closeDatabase();
  } catch (err) {
    console.warn('[Shutdown] Error closing database:', err);
  }
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize SQLite database
  initDatabase();

  // Register IPC handlers
  registerIpcHandlers(() => mainWindow);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  performShutdownCleanup();
});

app.on('window-all-closed', () => {
  performShutdownCleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Windows shutdown & signal traps
process.on('SIGINT', () => {
  performShutdownCleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  performShutdownCleanup();
  process.exit(0);
});
