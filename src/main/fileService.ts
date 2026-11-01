import fs from 'fs';
import path from 'path';
import { app, dialog } from 'electron';
import { FileItem } from '../common/types';

export function getDefaultProjectsDir(): string {
  try {
    const docs = app.getPath('documents');
    const studentProjects = path.join(docs, 'StudentProjects');
    if (!fs.existsSync(studentProjects)) {
      fs.mkdirSync(studentProjects, { recursive: true });
    }
    return studentProjects;
  } catch {
    const fallback = path.join(process.cwd(), 'projects');
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

export function readDirectory(dirPath: string): FileItem[] {
  if (!fs.existsSync(dirPath)) return [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const items: FileItem[] = [];

    // Sort: directories first, then files alphabetically
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      // Ignore hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          children: [], // Lazy loaded or empty
        });
      } else {
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: false,
          extension: path.extname(entry.name).toLowerCase(),
        });
      }
    }

    return items;
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
    return [];
  }
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function writeFile(filePath: string, content: string): boolean {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

export function createFile(parentDir: string, fileName: string, initialContent: string = ''): string {
  const targetPath = path.join(parentDir, fileName);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  fs.writeFileSync(targetPath, initialContent, 'utf-8');
  return targetPath;
}

export function createDirectory(parentDir: string, dirName: string): string {
  const targetPath = path.join(parentDir, dirName);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  return targetPath;
}

export function deletePath(targetPath: string): boolean {
  if (!fs.existsSync(targetPath)) return false;
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(targetPath);
  }
  return true;
}

export async function selectDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Project Folder',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
}
