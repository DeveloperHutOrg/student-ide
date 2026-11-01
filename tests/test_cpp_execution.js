const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const mingwBin = path.join(__dirname, '../runtimes/mingw/bin');
const gppExe = path.join(mingwBin, 'g++.exe');

console.log('Testing MinGW g++ exists:', fs.existsSync(gppExe));
console.log('g++ path:', gppExe);

const sourceCode = `
#include <iostream>
#include <string>

int main() {
    std::cout << "PROMPT: Enter student name:" << std::endl;
    std::string name;
    if (std::cin >> name) {
        std::cout << "GREETING: Hello " << name << " from C++17!" << std::endl;
    }
    return 0;
}
`;

const tempDir = path.join(__dirname, '../.data');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const srcFile = path.join(tempDir, 'test_interactive.cpp');
const outExe = path.join(tempDir, 'test_interactive.exe');

fs.writeFileSync(srcFile, sourceCode, 'utf-8');

console.log('1. Compiling C++17 source...');
const compile = spawn(gppExe, ['-std=c++17', srcFile, '-o', outExe], {
  env: { ...process.env, PATH: `${mingwBin};${process.env.PATH || ''}` }
});

compile.stderr.on('data', d => console.error('Compile error:', d.toString()));

compile.on('close', (code) => {
  console.log(`Compilation finished with code ${code}`);
  if (code !== 0) {
    process.exit(1);
  }

  console.log('2. Running compiled executable with interactive stdin...');
  const child = spawn(outExe, [], {
    cwd: tempDir,
    env: { ...process.env, PATH: `${mingwBin};${process.env.PATH || ''}` }
  });

  let output = '';
  child.stdout.on('data', d => {
    const text = d.toString();
    output += text;
    process.stdout.write('[PROG STDOUT]: ' + text);
    if (text.includes('PROMPT')) {
      console.log('-> Sending stdin input "Priya"');
      child.stdin.write('Priya\n');
    }
  });

  child.stderr.on('data', d => {
    console.error('[PROG STDERR]: ' + d.toString());
  });

  child.on('close', (runCode) => {
    console.log(`Program closed with code ${runCode}`);
    try {
      fs.unlinkSync(srcFile);
      fs.unlinkSync(outExe);
    } catch (e) {}

    if (output.includes('Hello Priya from C++17!')) {
      console.log('SUCCESS: C++17 compilation and interactive cin verified!');
      process.exit(0);
    } else {
      console.error('FAILED: Output did not contain expected greeting. Full output:\n' + output);
      process.exit(1);
    }
  });
});
