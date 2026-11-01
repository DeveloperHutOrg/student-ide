// scripts/generate_icons.js
// Renders 1024x1024 PNG from SVG using Electron Chromium, then builds multi-size Windows .ico

const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('force-device-scale-factor', '1');

app.whenReady().then(async () => {
  console.log('[Icon Generator] Initializing offscreen renderer...');

  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      offscreen: true,
    },
  });

  const svgPath = path.join(__dirname, '../src/assets/branding/logo-icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 1024px;
      height: 1024px;
      background: transparent;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: 1024px;
      height: 1024px;
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  // Allow fonts and rendering pipeline to settle
  await new Promise((r) => setTimeout(r, 1000));

  console.log('[Icon Generator] Capturing 1024x1024 frame...');
  const image = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });

  const png1024 = image.toPNG();
  console.log(`[Icon Generator] Captured PNG size: ${png1024.length} bytes`);

  // Target output paths
  const brandingDir = path.join(__dirname, '../src/assets/branding');
  const buildDir = path.join(__dirname, '../build');
  if (!fs.existsSync(brandingDir)) fs.mkdirSync(brandingDir, { recursive: true });
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

  // 1. Save 1024x1024 PNG
  fs.writeFileSync(path.join(brandingDir, 'icon.png'), png1024);
  fs.writeFileSync(path.join(buildDir, 'icon.png'), png1024);
  console.log('✓ Saved 1024x1024 transparent PNG to src/assets/branding/icon.png and build/icon.png');

  // 2. Generate standard icon sizes for ICO
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = [];

  for (const s of sizes) {
    const resized = image.resize({ width: s, height: s, quality: 'best' });
    const pngBuf = resized.toPNG();
    pngBuffers.push({ size: s, buffer: pngBuf });
    
    // Also save individual preview PNGs if useful
    fs.writeFileSync(path.join(brandingDir, `icon_${s}x${s}.png`), pngBuf);
  }
  console.log(`✓ Generated ${sizes.length} crisp multi-resolution PNG frames (16px to 256px)`);

  // 3. Assemble Windows ICO format (Vista/7/8/10/11 PNG-in-ICO standard)
  const count = pngBuffers.length;
  const headerLength = 6;
  const dirEntryLength = 16;
  const totalDirLength = count * dirEntryLength;
  let currentOffset = headerLength + totalDirLength;

  // Header: 6 bytes
  const header = Buffer.alloc(headerLength);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  const imageParts = [];

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(dirEntryLength);
    const w = item.size >= 256 ? 0 : item.size;
    const h = item.size >= 256 ? 0 : item.size;
    const size = item.buffer.length;

    entry.writeUInt8(w, 0); // Width
    entry.writeUInt8(h, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(size, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Image offset

    entries.push(entry);
    imageParts.push(item.buffer);
    currentOffset += size;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...imageParts]);

  fs.writeFileSync(path.join(brandingDir, 'icon.ico'), icoBuffer);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
  console.log(`✓ Successfully created Windows .ico (${icoBuffer.length} bytes) at src/assets/branding/icon.ico and build/icon.ico`);

  win.destroy();
  app.quit();
  process.exit(0);
});
