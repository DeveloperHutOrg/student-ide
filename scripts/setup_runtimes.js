// scripts/setup_runtimes.js
// Configures standalone MinGW-w64 toolchain (GCC 14.1.0) and official embeddable Python 3.11 in runtimes/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const runtimesDir = path.join(__dirname, '../runtimes');
if (!fs.existsSync(runtimesDir)) {
  fs.mkdirSync(runtimesDir, { recursive: true });
}

// 1. MinGW-w64 C++17 Toolchain
const mingwBin = path.join(runtimesDir, 'mingw/bin/g++.exe');
if (fs.existsSync(mingwBin)) {
  console.log('[Setup Runtimes] MinGW-w64 compiler already configured at:', mingwBin);
} else {
  console.log('[Setup Runtimes] MinGW-w64 toolchain not detected. Initializing setup...');
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
    
    // Prune unused share/ documentation to optimize installer size
    const shareDir = path.join(targetDir, 'share');
    if (fs.existsSync(shareDir)) {
      fs.rmSync(shareDir, { recursive: true, force: true });
    }

    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    console.log('[Setup Runtimes] MinGW-w64 toolchain successfully configured at:', mingwBin);
  } catch (err) {
    console.error('[Setup Runtimes] Error setting up MinGW-w64 toolchain:', err.message);
    process.exit(1);
  }
}

// 2. Python 3.11 Embeddable Runtime
const pythonBin = path.join(runtimesDir, 'python/python.exe');
if (fs.existsSync(pythonBin)) {
  console.log('[Setup Runtimes] Standalone Python runtime already configured at:', pythonBin);
} else {
  console.log('[Setup Runtimes] Python standalone runtime not detected. Initializing setup...');
  const pyZip = path.join(runtimesDir, 'python.zip');
  const pyDir = path.join(runtimesDir, 'python');
  const pyUrl = 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip';

  console.log('[Setup Runtimes] Downloading standalone Python embeddable runtime from:', pyUrl);
  try {
    if (!fs.existsSync(pyDir)) {
      fs.mkdirSync(pyDir, { recursive: true });
    }
    execSync(`curl.exe -L "${pyUrl}" -o "${pyZip}"`, { stdio: 'inherit' });
    console.log('[Setup Runtimes] Extracting Python runtime...');
    execSync(`tar.exe -xf "${pyZip}" -C "${pyDir}"`, { stdio: 'inherit' });
    if (fs.existsSync(pyZip)) {
      fs.unlinkSync(pyZip);
    }
    console.log('[Setup Runtimes] Standalone Python successfully configured at:', pythonBin);
  } catch (err) {
    console.error('[Setup Runtimes] Error setting up Python runtime:', err.message);
    process.exit(1);
  }
}
