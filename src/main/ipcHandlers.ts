import { ipcMain, BrowserWindow, shell } from 'electron';
import * as db from './db';
import * as fileService from './fileService';
import * as runner from './runner';
import { SupportedLanguageId } from '../common/types';

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Profile handlers
  ipcMain.handle('profile:get', async () => {
    return db.getProfile();
  });

  ipcMain.handle('profile:save', async (_, { name, studentClass }: { name: string; studentClass: number }) => {
    return db.saveProfile(name, studentClass);
  });

  // Onboarding handlers
  ipcMain.handle('onboarding:isCompleted', async () => {
    return db.isOnboardingCompleted();
  });

  ipcMain.handle('onboarding:setCompleted', async (_, completed: boolean) => {
    db.setOnboardingCompleted(completed);
  });

  // External browser URL handler
  ipcMain.handle('app:openExternal', async (_, url: string) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      await shell.openExternal(url);
    }
  });

  // Language preference handlers
  ipcMain.handle('languages:get', async () => {
    return db.getLanguagePreferences();
  });

  ipcMain.handle('languages:save', async (_, { enabledIds }: { enabledIds: SupportedLanguageId[] }) => {
    db.saveLanguagePreferences(enabledIds);
  });

  // File system handlers
  ipcMain.handle('fs:getDefaultProjectsDir', async () => {
    return fileService.getDefaultProjectsDir();
  });

  ipcMain.handle('fs:readDirectory', async (_, dirPath: string) => {
    return fileService.readDirectory(dirPath);
  });

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    return fileService.readFile(filePath);
  });

  ipcMain.handle('fs:writeFile', async (_, { filePath, content }: { filePath: string; content: string }) => {
    return fileService.writeFile(filePath, content);
  });

  ipcMain.handle('fs:createFile', async (_, { parentDir, fileName, initialContent }: { parentDir: string; fileName: string; initialContent?: string }) => {
    return fileService.createFile(parentDir, fileName, initialContent);
  });

  ipcMain.handle('fs:createDirectory', async (_, { parentDir, dirName }: { parentDir: string; dirName: string }) => {
    return fileService.createDirectory(parentDir, dirName);
  });

  ipcMain.handle('fs:deletePath', async (_, targetPath: string) => {
    return fileService.deletePath(targetPath);
  });

  ipcMain.handle('fs:selectDirectory', async () => {
    return fileService.selectDirectory();
  });

  // Execution runner handlers
  ipcMain.handle('runner:run', async (_, params: {
    language: SupportedLanguageId;
    code: string;
    filePath?: string;
    projectDir?: string;
  }) => {
    const win = getMainWindow();
    return runner.executeCode(win, params);
  });

  ipcMain.handle('runner:stop', async () => {
    const win = getMainWindow();
    runner.stopActiveExecution(win);
  });
}
