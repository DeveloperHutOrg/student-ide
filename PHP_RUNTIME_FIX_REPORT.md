# Student IDE: PHP Runtime Integration & ENOENT Fix Report

**Project:** Student IDE V1  
**Repository:** [DeveloperHutOrg/student-ide](https://github.com/DeveloperHutOrg/student-ide)  
**Target Platform:** Windows 10 & Windows 11 (x64)  
**Date:** November 1, 2026  
**Status:** Completed & Fully Verified  

---

## 1. Executive Summary

When running PHP code in previous packaged builds of Student IDE on a clean Windows computer without system-wide PHP installed, execution failed with:

```text
[Running PHP with php]
Process execution error: spawn php ENOENT
```

This error occurred because the PHP runtime was not bundled within the application's distribution package, and the runtime resolver fell back to searching the global system `PATH` for `php`, which did not exist on student machines.

To resolve this issue permanently and guarantee **100% offline functionality without external prerequisites**, an official standalone **Windows x64 PHP 8.2 CLI** runtime has been integrated directly into Student IDE. The runtime resolver, execution manager, Web Preview logic, build system, license notices, and test suites have been updated and verified.

---

## 2. Root Cause Analysis

1. **Missing Bundled Runtime:** Prior to this fix, the project bundled MinGW-w64 (GCC 14.1.0) and embeddable Python 3.11, but did not bundle a PHP executable under `runtimes/php/`.
2. **Unsafe Global PATH Fallback:** In `src/main/runner.ts`, `resolveRuntimePath('php')` returned the raw string `'php'`. In Node.js / Electron, `spawn('php', ...)` attempts to resolve `'php'` using the system's global `PATH` environment variable. On standard school lab computers and fresh student installations where PHP is not installed, `spawn` throws `ENOENT` (Error NO ENTry).
3. **Missing CLI File Argument:** The previous invocation did not supply the standard `-f` CLI execution flag, which is recommended for robust script execution across various PHP CLI builds.
4. **Missing DLL Search Path in Subprocess Environment:** PHP on Windows dynamically links against `php8.dll` and several third-party libraries (`icudt71.dll`, `libcrypto-3-x64.dll`, `libssl-3-x64.dll`, etc.) located adjacent to `php.exe`. Without prepending the PHP directory to `process.env.PATH` for the child process, Windows DLL resolution could fail on clean machines.
5. **Web Preview Collision:** When opening or running `.php` files, the application previously did not explicitly hide the HTML/CSS Web Preview panel, leading to an empty or confusing side panel instead of focusing on the Console Output terminal.

---

## 3. Bundled PHP Runtime Specifications

An official, standalone, non-thread-safe (NTS) PHP CLI distribution was integrated:

- **Component:** PHP 8.2.20 CLI (Win32-vs16-x64 NTS)
- **Official Source:** Windows PHP Distribution Archives (`https://windows.php.net/downloads/releases/archives/`)
- **Architecture:** x86_64 (64-bit Windows)
- **Bundled Executable:** `runtimes/php/php.exe` (installed at `resources/runtimes/php/php.exe` in production)
- **Core Library:** `runtimes/php/php8.dll`
- **Key Bundled Dependencies:**
  - `icudt71.dll`, `icuin71.dll`, `icuuc71.dll`, `icuio71.dll` (Unicode/ICU support)
  - `libcrypto-3-x64.dll`, `libssl-3-x64.dll` (OpenSSL 3 cryptographic libraries)
  - `libsodium.dll` (Modern cryptography)
  - `libsqlite3.dll` (SQLite engine)
  - `libpq.dll`, `libssh2.dll`, `nghttp2.dll`
- **Configuration:** Initialized `runtimes/php/php.ini` configured for safe local development (`display_errors = On`, `error_reporting = E_ALL`, `memory_limit = 128M`).

---

## 4. Implementation Details

### 4.1. Absolute Path Runtime Resolver (`src/main/runner.ts`)
The `resolveRuntimePath` function was updated with strict environment handling:

```ts
case 'php': {
  const bundledPhp = path.join(basePath, 'php', 'php.exe');
  if (fs.existsSync(bundledPhp)) return bundledPhp;

  // In packaged production, NEVER fallback to global PATH!
  if (isPackaged) return null;

  // In local development, check standard local paths before checking where.exe
  const commonPhpPaths = [
    'C:\\php\\php.exe',
    'C:\\tools\\php\\php.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'php', 'php.exe'),
  ];
  for (const p of commonPhpPaths) {
    if (fs.existsSync(p)) return p;
  }

  try {
    const { execSync } = require('child_process');
    const whereOut = execSync('where.exe php 2>nul', { encoding: 'utf-8' }).trim();
    const firstLine = whereOut.split(/\r?\n/)[0]?.trim();
    if (firstLine && fs.existsSync(firstLine)) return firstLine;
  } catch {}

  return null;
}
```

If the runtime is missing, the resolver returns `null` instead of `'php'`, allowing the runner to display a user-friendly error message (`Error: Could not resolve runtime engine for php`) rather than throwing an unhandled `ENOENT` exception.

### 4.2. Safe Child Process Spawning (`src/main/runner.ts`)
The PHP execution path was explicitly isolated:

```ts
} else if (language === 'php') {
  // Execute with PHP CLI using -f flag, ensuring php directory is in PATH for DLLs
  const phpDir = path.dirname(runtimePath);
  const args = ['-f', targetFilePath];
  child = spawn(runtimePath, args, {
    cwd: workingDir,
    env: {
      ...process.env,
      PATH: `${phpDir};${process.env.PATH || ''}`,
    },
  });
}
```

Key guarantees:
1. **Direct Binary Invocation:** Invokes `runtimePath` directly without a shell (`cmd.exe`), eliminating shell injection vulnerabilities.
2. **`-f` Flag:** Guarantees that PHP executes the target file in CLI mode.
3. **Local DLL Resolution:** Prepends `phpDir` to the child process's `PATH`, ensuring `php8.dll` and its supporting DLLs load reliably without polluting the machine's global environment.
4. **Standard Streams:** Full duplex streaming: `stdout` and `stderr` stream directly to the terminal, and `stdin` supports interactive input (`fgets(STDIN)`).
5. **Process Tree Termination:** When the student clicks "Stop", `taskkill /pid <PID> /T /F` terminates the entire process tree on Windows.
6. **Automatic Cleanup:** Temporary execution scripts in `%TEMP%/student_ide/` are cleanly deleted upon completion, error, or termination.

### 4.3. Web Preview Isolation (`src/renderer/App.tsx`)
Ensured that non-web technologies (PHP, Python, C++, SQL) explicitly dismiss the Web Preview pane:
- In `handleFileSelect`: `setShowPreview(false)` for non-HTML/CSS files.
- In `handleCreateFile`: `setShowPreview(false)` when creating PHP files.
- In `handleQuickStart`: Sets `showPreview` to `false` and opens the terminal (`setShowTerminal(true)`).
- In `handleRunCode`: Keeps preview closed and focuses the terminal output.

### 4.4. Automated Setup Script (`scripts/setup_runtimes.js`)
Updated the runtime bootstrap script to check `runtimes/php/php.exe`. If not detected (e.g. fresh clone of the repository), it downloads the official PHP 8.2 archive, unpacks it to `runtimes/php`, and initializes `php.ini`.

---

## 5. Third-Party License Compliance

PHP is licensed under **The PHP License, version 3.01**.
The license file is bundled directly with the binary at:
`runtimes/php/license.txt` (and installed to `resources/runtimes/php/license.txt`).

Per Section 6 of The PHP License, the required acknowledgment has been added to [THIRD_PARTY_LICENSES.md](file:///D:/Student%20IDE/THIRD_PARTY_LICENSES.md):

> **"This product includes PHP software, freely available from <http://www.php.net/software/>"**  
> **"PHP includes the Zend Engine, freely available at <http://www.zend.com>"**

Redistribution in binary form is fully compliant with all conditions:
- The copyright notice and disclaimer are preserved in `license.txt`.
- No derived products are named "PHP".
- The mandatory acknowledgment notice is prominently displayed in the project's documentation.

---

## 6. Verification and Test Results

A dedicated automated test suite was created in `tests/test_php_execution.js` and integrated into `npm test`:

| # | Test Scenario | Description | Result |
|---|---------------|-------------|--------|
| 1 | **Executable & Version** | Verifies `php.exe -v` executes and reports PHP 8.2 | **PASSED** |
| 2 | **Hello World & Echo** | Verifies basic script execution and stdout streaming | **PASSED** |
| 3 | **Variables, Arrays & JSON** | Verifies array manipulation and `json_encode` | **PASSED** |
| 4 | **Loops & Functions** | Computes factorial sum (1! + 2! + 3! + 4! + 5! = 153) | **PASSED** |
| 5 | **Syntax Error Handling** | Captures PHP syntax error in stderr with non-zero exit code | **PASSED** |
| 6 | **Missing Binary Safeguard** | Confirms missing runtime is trapped without app crash | **PASSED** |
| 7 | **Stop Execution / Taskkill** | Forcefully terminates infinite PHP loop via process tree kill | **PASSED** |
| 8 | **Interactive STDIN Input** | Tests `fgets(STDIN)` input streaming | **PASSED** |
| 9 | **Temp File Cleanup** | Confirms all temporary execution files are removed | **PASSED** |

### Complete Test Suite Summary
Running `npm test` executes:
1. `test_cpp_execution.js` (C++17 compilation & interactive `cin`) -> **PASSED**
2. `test_cpp_stop_execution.js` (C++ Stop button taskkill) -> **PASSED**
3. `test_admin_survey_module.js` (Offline Admin dashboard & CSV export) -> **PASSED**
4. `test_survey_module.js` (10/10 offline student survey tests) -> **PASSED**
5. `audit_phase3.js` (6/6 database migration & onboarding tests) -> **PASSED**
6. `test_two_computer_lab_simulation.js` (JSON export & duplicate prevention) -> **PASSED**
7. `test_session_management.js` (8/8 session logout & process termination) -> **PASSED**
8. `run_functional_test.js` (9/9 full IDE UI & all runners: JS, Python, SQL, C++, PHP) -> **PASSED**
9. `test_php_execution.js` (9/9 PHP CLI integration tests) -> **PASSED**

**Overall Test Suite Result: 100% Pass Rate (0 failures).**

---

## 7. Packaging & Distribution

The standalone PHP runtime is packaged via Electron Builder `extraResources` configuration in `package.json`:

```json
"extraResources": [
  {
    "from": "runtimes",
    "to": "runtimes",
    "filter": [
      "**/*"
    ]
  }
]
```

When installed via `Student-IDE-Setup-1.0.0-x64.exe`:
- Executable path: `<InstallDirectory>\resources\runtimes\php\php.exe`
- Total runtimes included: MinGW-w64 GCC 14.1, Python 3.11, PHP 8.2 CLI.
- No network connection or user configuration required at any point.
