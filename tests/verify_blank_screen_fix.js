// tests/verify_blank_screen_fix.js
// Automated verification script running inside Electron to inspect real DOM & console logs

const { app, BrowserWindow } = require('electron');
const path = require('path');
const assert = require('assert');

app.name = 'student-ide';

let hadSecurityError = false;
let hadCspWarning = false;
let uncaughtErrors = [];
let consoleLogs = [];

const db = require('../dist-electron/main/db');
const { registerIpcHandlers } = require('../dist-electron/main/ipcHandlers');

db.initDatabase();

app.whenReady().then(async () => {
  console.log('[Test] Electron initialized. Creating test window...');
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // background for test
    webPreferences: {
      preload: path.join(__dirname, '../dist-electron/preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  registerIpcHandlers(() => win);

  win.webContents.on('console-message', (event) => {
    const msg = event.message || '';
    consoleLogs.push(msg);
    console.log(`[Renderer Console] [${event.level}] ${msg}`);
    
    if (msg.includes('SecurityError') || msg.includes('Can only call open() on same-origin documents')) {
      hadSecurityError = true;
    }
    if (msg.includes('Insecure Content-Security-Policy')) {
      hadCspWarning = true;
    }
  });

  win.webContents.on('render-process-gone', (e, details) => {
    console.error('[Test] Render process gone:', details);
  });

  const indexPath = path.join(__dirname, '../dist/index.html');
  console.log('[Test] Loading:', indexPath);
  await win.loadFile(indexPath);

  // Wait 3 seconds for React, Monaco Editor, and WebPreview to mount and settle
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Inspect the DOM inside the renderer
  const domInfo = await win.webContents.executeJavaScript(`
    (() => {
      const root = document.getElementById('root');
      const hasApp = root && root.children.length > 0;
      const htmlText = root ? root.innerHTML : '';
      const hasNavbar = htmlText.includes('Student IDE');
      const hasMonaco = htmlText.includes('monaco-editor') || document.querySelector('.monaco-editor') !== null;
      const hasPreview = document.querySelector('iframe') !== null;
      const iframeSrcDoc = hasPreview ? document.querySelector('iframe').getAttribute('srcdoc') : null;
      return {
        hasApp,
        hasNavbar,
        hasMonaco,
        hasPreview,
        iframeHasSrcDoc: !!iframeSrcDoc,
        rootChildCount: root ? root.children.length : 0,
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
      };
    })()
  `);

  console.log('\n--- VERIFICATION RESULTS ---');
  console.log('DOM Inspection:', domInfo);
  console.log('SecurityError detected:', hadSecurityError);
  console.log('Insecure CSP Warning detected:', hadCspWarning);

  assert.strictEqual(hadSecurityError, false, 'FAILED: SecurityError was encountered!');
  assert.strictEqual(hadCspWarning, false, 'FAILED: Insecure CSP warning was encountered!');
  assert.strictEqual(domInfo.hasApp, true, 'FAILED: Root element is empty (Blank screen)!');
  assert.strictEqual(domInfo.hasNavbar, true, 'FAILED: Navbar was not rendered in root!');

  console.log('\n======================================================');
  console.log('SUCCESS: NO BLANK SCREEN! REACT UI RENDERED COMPLETELY');
  console.log('======================================================\n');

  win.destroy();
  app.quit();
});
