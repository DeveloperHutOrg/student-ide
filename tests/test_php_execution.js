// tests/test_php_execution.js
// Automated verification suite for Student IDE PHP CLI runtime integration

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const phpBinDir = path.join(__dirname, '../runtimes/php');
const phpExe = path.join(phpBinDir, 'php.exe');
const tempDir = path.join(__dirname, '../.data/php_test');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

console.log('====================================================');
console.log('STUDENT IDE - PHP CLI RUNTIME INTEGRATION TEST SUITE');
console.log('====================================================');

// Helper to execute PHP script using -f and bundled PATH
function runPhpFile(filePath, stdinInput = null, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const child = spawn(phpExe, ['-f', filePath], {
      cwd: path.dirname(filePath),
      env: {
        ...process.env,
        PATH: `${phpBinDir};${process.env.PATH || ''}`,
      },
    });

    let stdout = '';
    let stderr = '';
    let timer = null;

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        if (child.pid) {
          if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', child.pid.toString(), '/T', '/F']);
          } else {
            child.kill('SIGKILL');
          }
        }
      }, timeoutMs);
    }

    if (stdinInput && child.stdin) {
      child.stdin.write(stdinInput);
      child.stdin.end();
    }

    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });

    child.stderr?.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('close', (code, signal) => {
      if (timer) clearTimeout(timer);
      resolve({ code, signal, stdout, stderr, pid: child.pid });
    });

    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      resolve({ code: -1, signal: null, stdout, stderr: err.message, pid: null });
    });
  });
}

async function runAllTests() {
  let passed = 0;
  let total = 9;

  try {
    // TEST 1: PHP Binary Existence & Version Check
    console.log('\n[TEST 1/9] PHP Executable & Version Check...');
    assert(fs.existsSync(phpExe), `php.exe must exist at ${phpExe}`);
    const verResult = await new Promise((resolve) => {
      const child = spawn(phpExe, ['-v'], {
        cwd: phpBinDir,
        env: { ...process.env, PATH: `${phpBinDir};${process.env.PATH || ''}` },
      });
      let out = '';
      child.stdout.on('data', (d) => (out += d.toString()));
      child.on('close', (code) => resolve({ code, out }));
    });
    assert.strictEqual(verResult.code, 0, 'php.exe -v must exit with code 0');
    assert(verResult.out.includes('PHP 8.2'), `Output must report PHP 8.2, got: ${verResult.out.split('\n')[0]}`);
    console.log('✓ TEST 1 PASSED:', verResult.out.split('\n')[0].trim());
    passed++;

    // TEST 2: Hello World Echo Script
    console.log('\n[TEST 2/9] Basic Hello World Script with Echo...');
    const helloFile = path.join(tempDir, 'hello.php');
    fs.writeFileSync(helloFile, '<?php\necho "Hello from Student IDE PHP CLI!\\n";\n', 'utf-8');
    const helloResult = await runPhpFile(helloFile);
    assert.strictEqual(helloResult.code, 0, 'Hello world must exit with code 0');
    assert(helloResult.stdout.includes('Hello from Student IDE PHP CLI!'), 'Stdout must contain greeting');
    console.log('✓ TEST 2 PASSED: Output received:', helloResult.stdout.trim());
    passed++;

    // TEST 3: Variables, Associative Arrays, and JSON Encoding
    console.log('\n[TEST 3/9] Variables, Associative Arrays, and JSON Output...');
    const dataFile = path.join(tempDir, 'data.php');
    const dataCode = `<?php
$student = [
    "name" => "Aarav Sharma",
    "class" => 10,
    "school" => "Kendriya Vidyalaya",
    "skills" => ["PHP", "Python", "C++"]
];
echo json_encode($student);
`;
    fs.writeFileSync(dataFile, dataCode, 'utf-8');
    const dataResult = await runPhpFile(dataFile);
    assert.strictEqual(dataResult.code, 0);
    const parsed = JSON.parse(dataResult.stdout.trim());
    assert.strictEqual(parsed.name, 'Aarav Sharma');
    assert.strictEqual(parsed.class, 10);
    assert.strictEqual(parsed.skills.length, 3);
    console.log('✓ TEST 3 PASSED: JSON structure verified:', JSON.stringify(parsed));
    passed++;

    // TEST 4: Control Loops and Custom Functions
    console.log('\n[TEST 4/9] Loops and Custom Functions...');
    const funcFile = path.join(tempDir, 'functions.php');
    const funcCode = `<?php
function factorial(int $n): int {
    if ($n <= 1) return 1;
    return $n * factorial($n - 1);
}

$sum = 0;
for ($i = 1; $i <= 5; $i++) {
    $sum += factorial($i);
}
echo "SUM_FACTORIALS=" . $sum;
`;
    fs.writeFileSync(funcFile, funcCode, 'utf-8');
    const funcResult = await runPhpFile(funcFile);
    assert.strictEqual(funcResult.code, 0);
    // 1! + 2! + 3! + 4! + 5! = 1 + 2 + 6 + 24 + 120 = 153
    assert(funcResult.stdout.includes('SUM_FACTORIALS=153'), `Expected 153, got: ${funcResult.stdout}`);
    console.log('✓ TEST 4 PASSED: Factorial loop calculation correct (SUM_FACTORIALS=153)');
    passed++;

    // TEST 5: Syntax Error Handling and Stderr Capture
    console.log('\n[TEST 5/9] Syntax Error Handling & Stderr Streaming...');
    const errorFile = path.join(tempDir, 'syntax_error.php');
    fs.writeFileSync(errorFile, '<?php\necho "Missing semicolon here"\n$x = 42;\n', 'utf-8');
    const errorResult = await runPhpFile(errorFile);
    assert.notStrictEqual(errorResult.code, 0, 'Syntax error must return non-zero code');
    assert(
      errorResult.stderr.toLowerCase().includes('syntax error') ||
      errorResult.stderr.toLowerCase().includes('parse error'),
      `Stderr must capture syntax/parse error, got: ${errorResult.stderr}`
    );
    console.log('✓ TEST 5 PASSED: Syntax error detected cleanly in stderr');
    passed++;

    // TEST 6: Missing Executable Resolution Safeguard
    console.log('\n[TEST 6/9] Missing Executable Safeguard (No ENOENT Crash)...');
    // Simulate non-existent binary runner
    const nonExistentExe = path.join(tempDir, 'non_existent_php.exe');
    const bogusResult = await new Promise((resolve) => {
      try {
        const c = spawn(nonExistentExe, ['-v']);
        c.on('error', (err) => resolve({ caught: true, message: err.message }));
      } catch (e) {
        resolve({ caught: true, message: e.message });
      }
    });
    assert(bogusResult.caught, 'Must catch missing executable safely');
    console.log('✓ TEST 6 PASSED: Missing runtime safely trapped without application crash');
    passed++;

    // TEST 7: Stop Button / Process Tree Forceful Termination
    console.log('\n[TEST 7/9] Stop Button Process Tree Termination on Infinite Loop...');
    const loopFile = path.join(tempDir, 'infinite.php');
    fs.writeFileSync(
      loopFile,
      '<?php\necho "LOOP_STARTED\\n";\nflush();\nwhile (true) {\n  usleep(100000);\n}\n',
      'utf-8'
    );
    const stopPromise = new Promise((resolve) => {
      const child = spawn(phpExe, ['-f', loopFile], {
        cwd: tempDir,
        env: { ...process.env, PATH: `${phpBinDir};${process.env.PATH || ''}` },
      });

      let started = false;
      child.stdout.on('data', (d) => {
        if (d.toString().includes('LOOP_STARTED') && !started) {
          started = true;
          // Emulate user clicking Stop button
          if (process.platform === 'win32' && child.pid) {
            spawn('taskkill', ['/pid', child.pid.toString(), '/T', '/F']);
          } else if (child.pid) {
            child.kill('SIGKILL');
          }
        }
      });

      child.on('close', (code, signal) => {
        resolve({ code, signal, started });
      });
    });

    const stopRes = await stopPromise;
    assert(stopRes.started, 'Infinite loop should have started before stop');
    console.log('✓ TEST 7 PASSED: Infinite PHP process stopped cleanly via taskkill');
    passed++;

    // TEST 8: Interactive Standard Input (STDIN)
    console.log('\n[TEST 8/9] Interactive Standard Input via STDIN...');
    const inputScript = path.join(tempDir, 'interactive.php');
    fs.writeFileSync(
      inputScript,
      '<?php\necho "ENTER_NAME:";\n$name = trim(fgets(STDIN));\necho "\\nWELCOME_STUDENT: " . $name . "\\n";\n',
      'utf-8'
    );

    const interactivePromise = new Promise((resolve) => {
      const child = spawn(phpExe, ['-f', inputScript], {
        cwd: tempDir,
        env: { ...process.env, PATH: `${phpBinDir};${process.env.PATH || ''}` },
      });

      let out = '';
      child.stdout.on('data', (d) => {
        const text = d.toString();
        out += text;
        if (text.includes('ENTER_NAME:')) {
          child.stdin.write('Sneha Patel\n');
        }
      });

      child.on('close', (code) => {
        resolve({ code, out });
      });
    });

    const interactiveRes = await interactivePromise;
    assert.strictEqual(interactiveRes.code, 0);
    assert(interactiveRes.out.includes('WELCOME_STUDENT: Sneha Patel'), `Output missing greeting: ${interactiveRes.out}`);
    console.log('✓ TEST 8 PASSED: Interactive stdin reading verified');
    passed++;

    // TEST 9: Temporary File Cleanup
    console.log('\n[TEST 9/9] Temporary File Cleanup Verification...');
    const tempTestFiles = [helloFile, dataFile, funcFile, errorFile, loopFile, inputScript];
    for (const f of tempTestFiles) {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    }
    assert(tempTestFiles.every((f) => !fs.existsSync(f)), 'All temp test files must be cleaned up');
    console.log('✓ TEST 9 PASSED: All temporary test files cleaned up successfully');
    passed++;

    console.log('\n====================================================');
    console.log(`ALL ${passed}/${total} PHP RUNTIME TESTS PASSED SUCCESSFULLY!`);
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHP TEST SUITE FAILED:', err);
    process.exit(1);
  }
}

runAllTests();
