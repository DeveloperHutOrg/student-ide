const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const mingwBin = path.join(__dirname, '../runtimes/mingw/bin');
const gppExe = path.join(mingwBin, 'g++.exe');

const tempDir = path.join(__dirname, '../.data');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const srcFile = path.join(tempDir, 'test_infinite_loop.cpp');
const outExe = path.join(tempDir, 'test_infinite_loop.exe');

const sourceCode = `
#include <iostream>
#include <chrono>
#include <thread>

int main() {
    std::cout << "[LOOP_STARTED]" << std::endl;
    int count = 0;
    while (true) {
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
        std::cout << "Tick: " << ++count << std::endl;
    }
    return 0;
}
`;

fs.writeFileSync(srcFile, sourceCode, 'utf-8');

console.log('1. Compiling infinite loop C++17 program...');
const compile = spawn(gppExe, ['-std=c++17', srcFile, '-o', outExe], {
  env: { ...process.env, PATH: `${mingwBin};${process.env.PATH || ''}` }
});

compile.on('close', (code) => {
  assert.strictEqual(code, 0, 'Compilation must succeed');
  console.log('2. Spawning infinite loop program...');

  const child = spawn(outExe, [], {
    cwd: tempDir,
    env: { ...process.env, PATH: `${mingwBin};${process.env.PATH || ''}` }
  });

  let ticks = 0;
  child.stdout.on('data', d => {
    const text = d.toString();
    process.stdout.write(text);
    if (text.includes('Tick:')) {
      ticks++;
      if (ticks >= 2) {
        console.log(`\n3. Simulating Stop button: terminating process tree (PID: ${child.pid})...`);
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', child.pid.toString(), '/T', '/F']);
        } else {
          child.kill('SIGKILL');
        }
      }
    }
  });

  child.on('close', (exitCode) => {
    console.log(`4. Process terminated with exit code: ${exitCode}`);
    try {
      fs.unlinkSync(srcFile);
      fs.unlinkSync(outExe);
    } catch (e) {}
    console.log('✓ Stop verification PASSED: Long-running C++ process stopped successfully.');
    process.exit(0);
  });
});
