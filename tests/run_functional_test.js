const { spawn } = require('child_process');
const path = require('path');

const electronExe = path.join(__dirname, '../node_modules/electron/dist/electron.exe');
const testScript = path.join(__dirname, 'verify_full_ide_features.js');

const proc = spawn(electronExe, [testScript], {
  env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
});

proc.stdout.on('data', (d) => process.stdout.write(d.toString()));
proc.stderr.on('data', (d) => process.stderr.write(d.toString()));

proc.on('close', (code) => {
  console.log(`\n[Runner Process Closed with Exit Code: ${code}]`);
  process.exit(code || 0);
});
