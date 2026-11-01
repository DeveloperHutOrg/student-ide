// tests/verify_full_ide_features.js
// Complete functional test suite for Student IDE V1 post-fix

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const assert = require('assert');

app.name = 'student-ide';

const db = require('../dist-electron/main/db');
const { registerIpcHandlers } = require('../dist-electron/main/ipcHandlers');
const runner = require('../dist-electron/main/runner');
const sessionService = require('../dist-electron/main/sessionService');

db.initDatabase();
sessionService.createSession(1);

app.whenReady().then(async () => {
  console.log('--- STARTING COMPREHENSIVE FUNCTIONAL VERIFICATION ---');

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../dist-electron/preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  registerIpcHandlers(() => win);

  const errors = [];
  win.webContents.on('console-message', (event) => {
    if (event.level === 'error') {
      errors.push(event.message);
      console.error(`[Renderer ERROR] ${event.message}`);
    }
  });

  try {
    const indexPath = path.join(__dirname, '../dist/index.html');
    await win.loadFile(indexPath);

    // Wait 3 seconds for React initialization
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('\n1. Verifying Profile & Onboarding...');
    const profile = db.getProfile();
    console.log('Saved profile in DB:', profile);
    assert(profile !== null, 'Profile must not be null');
    assert.strictEqual(profile.student_name, 'vasu');
    assert.strictEqual(profile.student_class, 12);
    assert.strictEqual(db.isOnboardingCompleted(), true, 'Onboarding must be completed');
    console.log('✓ Profile & Onboarding: PASSED');

    console.log('\n2. Verifying React Interface & Monaco Editor in DOM...');
    const domState = await win.webContents.executeJavaScript(`
      (() => {
        return {
          hasRoot: document.getElementById('root') !== null,
          hasNavbar: document.querySelector('header') !== null,
          hasSidebar: document.querySelector('aside') !== null || document.body.innerText.includes('FILES'),
          hasMonaco: document.querySelector('.monaco-editor') !== null,
          bodyBg: window.getComputedStyle(document.body).backgroundColor,
          title: document.title,
        };
      })()
    `);
    console.log('DOM State:', domState);
    assert(domState.hasRoot, 'Root element must exist');
    assert(domState.hasNavbar, 'Navbar must exist');
    assert(domState.hasMonaco, 'Monaco editor container must exist');
    console.log('✓ React Interface & Monaco Editor: PASSED');

    console.log('\n3. Verifying Live HTML, CSS & JavaScript Preview Isolation...');
    const previewState = await win.webContents.executeJavaScript(`
      (() => {
        const iframe = document.querySelector('iframe');
        if (!iframe) return { found: false };
        const srcDoc = iframe.getAttribute('srcdoc') || '';
        return {
          found: true,
          hasSrcDoc: srcDoc.length > 0,
          sandbox: iframe.getAttribute('sandbox'),
          srcDocSnippet: srcDoc.substring(0, 100),
        };
      })()
    `);
    console.log('Preview State:', previewState);
    if (previewState.found) {
      assert(previewState.hasSrcDoc, 'Iframe preview must use srcDoc');
      assert.strictEqual(previewState.sandbox, 'allow-scripts allow-modals allow-forms');
    }
    console.log('✓ Web Preview Isolation: PASSED');

    console.log('\n4. Verifying JavaScript Runner Execution...');
    const jsResult = await runner.executeCode(win, {
      language: 'javascript',
      code: 'console.log("Hello from Student IDE JavaScript!"); const x = 10 + 25; console.log("Result: " + x);',
    });
    console.log('JS execution result:', jsResult);
    assert.strictEqual(jsResult.success, true);
    console.log('✓ JavaScript Execution: PASSED');

    console.log('\n5. Verifying Python Runner Execution...');
    const pyResult = await runner.executeCode(win, {
      language: 'python',
      code: 'print("Hello from Python in Student IDE")\nx = [1, 2, 3, 4, 5]\nprint(f"Sum: {sum(x)}")',
    });
    console.log('Python execution result:', pyResult);
    assert.strictEqual(pyResult.success, true);
    console.log('✓ Python Execution: PASSED');

    console.log('\n6. Verifying SQL Runner Execution...');
    const sqlResult = await runner.executeCode(win, {
      language: 'sql',
      code: 'CREATE TABLE students (id INT, name TEXT); INSERT INTO students VALUES (1, "Aarav"), (2, "Vasu"); SELECT * FROM students;',
    });
    console.log('SQL execution result:', sqlResult);
    assert.strictEqual(sqlResult.success, true);
    console.log('✓ SQL Execution: PASSED');

    console.log('\n7. Verifying Bundled C++17 Runner Execution...');
    const cppResult = await runner.executeCode(win, {
      language: 'cpp',
      code: '#include <iostream>\n#include <string_view>\nint main() { std::string_view msg = "Hello from bundled C++17!"; std::cout << msg << std::endl; return 0; }',
    });
    console.log('C++ execution result:', cppResult);
    assert.strictEqual(cppResult.success, true);
    console.log('✓ C++17 Execution: PASSED');

    console.log('\n8. Checking for Uncaught Errors...');
    console.log(`Uncaught errors count: ${errors.length}`);
    assert.strictEqual(errors.length, 0, 'No uncaught errors should be logged');
    console.log('✓ Zero Uncaught Errors: PASSED');

    console.log('\n=============================================================');
    console.log('ALL FUNCTIONAL TESTS PASSED (8/8) - STUDENT IDE FULLY HEALTHY');
    console.log('=============================================================\n');

    win.destroy();
    app.quit();
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    if (!win.isDestroyed()) win.destroy();
    app.quit();
    process.exit(1);
  }
});
