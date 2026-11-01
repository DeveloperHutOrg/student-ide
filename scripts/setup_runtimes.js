// scripts/setup_runtimes.js
// Downloads and extracts standalone MinGW-w64 toolchain (GCC 14.1.0) into runtimes/mingw if not already present.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const runtimesDir = path.join(__dirname, '../runtimes');
const mingwBin = path.join(runtimesDir, 'mingw/bin/g++.exe');

if (fs.existsSync(mingwBin)) {
  console.log('[Setup Runtimes] MinGW-w64 compiler already configured at:', mingwBin);
  process.exit(0);
}

console.log('[Setup Runtimes] MinGW-w64 toolchain not detected. Initializing setup...');
if (!fs.existsSync(runtimesDir)) {
  fs.mkdirSync(runtimesDir, { recursive: true });
}

const zipPath = path.join(runtimesDir, 'w64devkit.zip');
const downloadUrl = 'https://github.com/skeeto/w64devkit/releases/download/v1.23.0/w64devkit-1.23.0.zip';

console.log('[Setup Runtimes] Downloading standalone MinGW-w64 toolchain from:', downloadUrl);
try {
  execSync(`curl.exe -L "${downloadUrl}" -o "${zipPath}"`, { stdio: 'inherit' });
  console.log('[Setup Runtimes] Extracting archive...');
  execSync(`tar.exe -xf "${zipPath}" -C "${runtimesDir}"`, { stdio: 'inherit' });
  
  const extractedDir = path.join(runtimesDir, 'w64devkit');
  const targetDir = path.join(runtimesDir, 'mingw');
  if (fs.existsSync(extractedDir)) {
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    fs.renameSync(extractedDir, targetDir);
  }
  
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  console.log('[Setup Runtimes] MinGW-w64 toolchain successfully configured at:', mingwBin);
} catch (err) {
  console.error('[Setup Runtimes] Error setting up MinGW-w64 toolchain:', err.message);
  process.exit(1);
}
