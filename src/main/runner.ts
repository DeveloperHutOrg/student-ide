import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { app, BrowserWindow } from 'electron';
import { DatabaseSync } from 'node:sqlite';
import { SupportedLanguageId, ExecutionOutput, ExecutionResult } from '../common/types';

interface ActiveProcessInfo {
  process: ChildProcess;
  timeoutTimer: NodeJS.Timeout;
  startTime: number;
  tempFilesToClean: string[];
}

let activeExecution: ActiveProcessInfo | null = null;

export function emitOutput(window: BrowserWindow | null, type: ExecutionOutput['type'], text: string): void {
  if (!window || window.isDestroyed()) return;
  window.webContents.send('execution:output', {
    type,
    text,
    timestamp: Date.now(),
  });
}

export function emitComplete(window: BrowserWindow | null, result: ExecutionResult): void {
  if (!window || window.isDestroyed()) return;
  window.webContents.send('execution:complete', result);
}

/**
 * Detect runtime executable path:
 * 1. Bundled in app directory: <appPath>/runtimes/<lang>/...
 * 2. System PATH or known installation directory
 */
export function resolveRuntimePath(language: SupportedLanguageId): string | null {
  const isPackaged = app ? app.isPackaged : false;
  const basePath = isPackaged 
    ? path.join(process.resourcesPath, 'runtimes') 
    : path.join(__dirname, '../../runtimes');

  switch (language) {
    case 'python': {
      const bundled = path.join(basePath, 'python', 'python.exe');
      if (fs.existsSync(bundled)) return bundled;

      // Common Python locations on Windows
      const localAppPython = path.join(os.homedir(), 'AppData/Local/Programs/Python/Python311/python.exe');
      if (fs.existsSync(localAppPython)) return localAppPython;

      const localAppPython312 = path.join(os.homedir(), 'AppData/Local/Programs/Python/Python312/python.exe');
      if (fs.existsSync(localAppPython312)) return localAppPython312;

      return 'python'; // Fallback to PATH
    }

    case 'javascript': {
      // Electron has node bundled or system node
      return 'node';
    }

    case 'cpp': {
      const bundledGpp = path.join(basePath, 'mingw', 'bin', 'g++.exe');
      if (fs.existsSync(bundledGpp)) return bundledGpp;
      
      const commonMinGW = 'C:\\MinGW\\bin\\g++.exe';
      if (fs.existsSync(commonMinGW)) return commonMinGW;

      return 'g++'; // Fallback to PATH
    }

    case 'php': {
      const bundledPhp = path.join(basePath, 'php', 'php.exe');
      if (fs.existsSync(bundledPhp)) return bundledPhp;
      return 'php'; // Fallback to PATH
    }

    case 'sql':
    case 'html':
    case 'css':
      return 'internal';

    default:
      return null;
  }
}

/**
 * Safely terminates the active process and its entire child process tree on Windows.
 */
export function stopActiveExecution(window: BrowserWindow | null): void {
  if (!activeExecution) return;

  const { process: child, timeoutTimer, startTime, tempFilesToClean } = activeExecution;
  clearTimeout(timeoutTimer);

  (child as any).wasStopped = true;
  try {
    if (child.pid) {
      if (process.platform === 'win32') {
        // Windows command to kill process and its child processes tree forcefully
        spawn('taskkill', ['/pid', child.pid.toString(), '/T', '/F']);
      } else {
        child.kill('SIGKILL');
      }
    }
  } catch (err) {
    // Ignore error if process already exited
  }

  // Clean up any temp files created for this execution
  for (const file of tempFilesToClean) {
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch {}
  }

  activeExecution = null;
  emitOutput(window, 'info', '\n[Execution stopped by student]\n');
  emitComplete(window, {
    exitCode: -1,
    durationMs: Date.now() - startTime,
    status: 'stopped',
  });
}

/**
 * Execute SQL scripts using built-in node:sqlite and format results into tabular output.
 */
function runSqlInternal(code: string, window: BrowserWindow | null): void {
  const startTime = Date.now();
  emitOutput(window, 'info', `[Executing SQL using built-in SQLite Engine]\n`);

  try {
    const db = new DatabaseSync(':memory:');
    
    // Split script into statements
    const statements = code
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (statements.length === 0) {
      emitOutput(window, 'info', 'No SQL statements to execute.\n');
      emitComplete(window, { exitCode: 0, durationMs: Date.now() - startTime, status: 'completed' });
      db.close();
      return;
    }

    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i];
      const isSelect = /^\s*(SELECT|PRAGMA|EXPLAIN)\b/i.test(sql);

      if (isSelect) {
        const stmt = db.prepare(sql);
        const rows = stmt.all() as any[];

        if (rows.length === 0) {
          emitOutput(window, 'stdout', `Query ${i + 1}: (0 rows returned)\n\n`);
        } else {
          const columns = Object.keys(rows[0]);
          // Calculate column widths
          const colWidths: Record<string, number> = {};
          columns.forEach(col => {
            colWidths[col] = Math.max(col.length, ...rows.map(r => String(r[col] ?? '').length));
          });

          // Format table
          const header = '| ' + columns.map(c => c.padEnd(colWidths[c])).join(' | ') + ' |';
          const separator = '+-' + columns.map(c => '-'.repeat(colWidths[c])).join('-+-') + '-+';

          let tableStr = `${separator}\n${header}\n${separator}\n`;
          for (const row of rows) {
            const rowStr = '| ' + columns.map(c => String(row[c] ?? '').padEnd(colWidths[c])).join(' | ') + ' |';
            tableStr += `${rowStr}\n`;
          }
          tableStr += `${separator}\n(${rows.length} row${rows.length > 1 ? 's' : ''} returned)\n\n`;
          emitOutput(window, 'stdout', tableStr);
        }
      } else {
        db.exec(sql);
        emitOutput(window, 'stdout', `Statement ${i + 1}: Executed successfully.\n`);
      }
    }

    db.close();
    emitOutput(window, 'success', `\n[Execution completed in ${Date.now() - startTime}ms]\n`);
    emitComplete(window, {
      exitCode: 0,
      durationMs: Date.now() - startTime,
      status: 'completed',
    });
  } catch (err: any) {
    emitOutput(window, 'error', `\nSQL Error: ${err.message || String(err)}\n`);
    emitComplete(window, {
      exitCode: 1,
      durationMs: Date.now() - startTime,
      status: 'error',
      error: err.message,
    });
  }
}

/**
 * Safe process execution runner for Python, JavaScript, C++, and PHP.
 */
export async function executeCode(
  window: BrowserWindow | null,
  params: {
    language: SupportedLanguageId;
    code: string;
    filePath?: string;
    projectDir?: string;
  }
): Promise<{ executionId: string; success: boolean }> {
  // If an execution is already running, terminate it first
  if (activeExecution) {
    stopActiveExecution(window);
  }

  const { language, code, filePath, projectDir } = params;
  const executionId = 'exec_' + Date.now();
  const startTime = Date.now();
  const timeoutMs = 15000; // 15-second safeguard timeout

  // Special treatment for HTML & CSS (Web technologies)
  if (language === 'html' || language === 'css') {
    emitOutput(window, 'info', `[Web Technology: ${language.toUpperCase()}]\n`);
    emitOutput(window, 'success', `Preview refreshed in the built-in HTML/CSS viewer.\n`);
    emitComplete(window, {
      exitCode: 0,
      durationMs: 10,
      status: 'completed',
    });
    return { executionId, success: true };
  }

  // Special treatment for SQL
  if (language === 'sql') {
    runSqlInternal(code, window);
    return { executionId, success: true };
  }

  // Prepare executable and arguments
  const tempFilesToClean: string[] = [];
  const tempDir = path.join(os.tmpdir(), 'student_ide');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let targetFilePath = filePath;
  if (!targetFilePath || !fs.existsSync(targetFilePath)) {
    const ext = language === 'python' ? '.py' : language === 'javascript' ? '.js' : language === 'cpp' ? '.cpp' : '.php';
    targetFilePath = path.join(tempDir, `code_${Date.now()}${ext}`);
    fs.writeFileSync(targetFilePath, code, 'utf-8');
    tempFilesToClean.push(targetFilePath);
  }

  const workingDir = projectDir && fs.existsSync(projectDir) ? projectDir : path.dirname(targetFilePath);
  const runtimePath = resolveRuntimePath(language);

  if (!runtimePath) {
    emitOutput(window, 'error', `Error: Could not resolve runtime engine for ${language}.\n`);
    emitComplete(window, {
      exitCode: 1,
      durationMs: 0,
      status: 'error',
      error: `Runtime not found for ${language}`,
    });
    return { executionId, success: false };
  }

  emitOutput(window, 'info', `[Running ${language.toUpperCase()} with ${runtimePath}]\n`);

  try {
    let child: ChildProcess;

    if (language === 'cpp') {
      // Step 1: Compile C++ to temp executable
      const outExe = path.join(tempDir, `prog_${Date.now()}.exe`);
      tempFilesToClean.push(outExe);

      emitOutput(window, 'info', `Compiling ${path.basename(targetFilePath)}...\n`);
      
      const compileProcess = spawn(runtimePath, [targetFilePath, '-o', outExe], {
        cwd: workingDir,
        shell: true,
      });

      let compileStderr = '';
      compileProcess.stderr?.on('data', data => {
        compileStderr += data.toString();
        emitOutput(window, 'stderr', data.toString());
      });

      const compileCode = await new Promise<number | null>(resolve => {
        compileProcess.on('close', code => resolve(code));
        compileProcess.on('error', () => resolve(-1));
      });

      if (compileCode !== 0) {
        emitOutput(window, 'error', `\n[Compilation failed with code ${compileCode}]\n`);
        emitComplete(window, {
          exitCode: compileCode,
          durationMs: Date.now() - startTime,
          status: 'error',
          error: compileStderr,
        });
        return { executionId, success: false };
      }

      emitOutput(window, 'success', `[Compilation successful. Running program...]\n\n`);
      child = spawn(outExe, [], { cwd: workingDir });
    } else {
      // Python, JavaScript, PHP
      const args = [targetFilePath];
      child = spawn(runtimePath, args, { cwd: workingDir });
    }

    const timeoutTimer = setTimeout(() => {
      emitOutput(window, 'error', `\n[Execution timed out after ${timeoutMs / 1000} seconds]\n`);
      stopActiveExecution(window);
    }, timeoutMs);

    activeExecution = {
      process: child,
      timeoutTimer,
      startTime,
      tempFilesToClean,
    };

    child.stdout?.on('data', data => {
      emitOutput(window, 'stdout', data.toString());
    });

    child.stderr?.on('data', data => {
      emitOutput(window, 'stderr', data.toString());
    });

    child.on('error', err => {
      clearTimeout(timeoutTimer);
      activeExecution = null;
      emitOutput(window, 'error', `Process execution error: ${err.message}\n`);
      emitComplete(window, {
        exitCode: 1,
        durationMs: Date.now() - startTime,
        status: 'error',
        error: err.message,
      });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timeoutTimer);
      activeExecution = null;

      if ((child as any).wasStopped) {
        return;
      }

      // Clean temp files
      for (const f of tempFilesToClean) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
      }

      const durationMs = Date.now() - startTime;
      const status = code === 0 ? 'completed' : 'error';
      emitOutput(
        window,
        code === 0 ? 'success' : 'error',
        `\n[Process finished with exit code ${code ?? signal} in ${durationMs}ms]\n`
      );

      emitComplete(window, {
        exitCode: code,
        durationMs,
        status,
      });
    });

    return { executionId, success: true };
  } catch (err: any) {
    emitOutput(window, 'error', `Failed to start process: ${err.message}\n`);
    emitComplete(window, {
      exitCode: 1,
      durationMs: Date.now() - startTime,
      status: 'error',
      error: err.message,
    });
    return { executionId, success: false };
  }
}
