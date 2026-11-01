import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI, SupportedLanguageId, ExecutionOutput, ExecutionResult } from '../common/types';

const api: ElectronAPI = {
  // Profile
  getProfile: () => ipcRenderer.invoke('profile:get'),
  saveProfile: (name: string, studentClass: number) =>
    ipcRenderer.invoke('profile:save', { name, studentClass }),

  // Languages
  getLanguagePreferences: () => ipcRenderer.invoke('languages:get'),
  saveLanguagePreferences: (enabledIds: SupportedLanguageId[]) =>
    ipcRenderer.invoke('languages:save', { enabledIds }),

  // File Operations
  getDefaultProjectsDir: () => ipcRenderer.invoke('fs:getDefaultProjectsDir'),
  readDirectory: (dirPath: string) => ipcRenderer.invoke('fs:readDirectory', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('fs:writeFile', { filePath, content }),
  createFile: (parentDir: string, fileName: string, initialContent?: string) =>
    ipcRenderer.invoke('fs:createFile', { parentDir, fileName, initialContent }),
  createDirectory: (parentDir: string, dirName: string) =>
    ipcRenderer.invoke('fs:createDirectory', { parentDir, dirName }),
  deletePath: (targetPath: string) => ipcRenderer.invoke('fs:deletePath', targetPath),
  selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),

  // Execution
  runCode: (params) => ipcRenderer.invoke('runner:run', params),
  stopExecution: () => ipcRenderer.invoke('runner:stop'),
  sendStdin: (input: string) => ipcRenderer.invoke('runner:sendStdin', input),

  // Streaming events
  onExecutionOutput: (callback: (output: ExecutionOutput) => void) => {
    const handler = (_: any, data: ExecutionOutput) => callback(data);
    ipcRenderer.on('execution:output', handler);
    return () => {
      ipcRenderer.removeListener('execution:output', handler);
    };
  },

  onExecutionComplete: (callback: (result: ExecutionResult) => void) => {
    const handler = (_: any, data: ExecutionResult) => callback(data);
    ipcRenderer.on('execution:complete', handler);
    return () => {
      ipcRenderer.removeListener('execution:complete', handler);
    };
  },

  // Onboarding & Utilities
  isOnboardingCompleted: () => ipcRenderer.invoke('onboarding:isCompleted'),
  setOnboardingCompleted: (completed: boolean) =>
    ipcRenderer.invoke('onboarding:setCompleted', completed),
  openExternalUrl: (url: string) => ipcRenderer.invoke('app:openExternal', url),

  // Survey Module
  getSurveyStatus: (surveyId?: string) => ipcRenderer.invoke('survey:getStatus', surveyId),
  getSurveyQuestions: (surveyId?: string) => ipcRenderer.invoke('survey:getQuestions', surveyId),
  submitSurvey: (payload) => ipcRenderer.invoke('survey:submit', payload),
  getSurveyResponse: (surveyId?: string) => ipcRenderer.invoke('survey:getResponse', surveyId),
  survey: {
    getStatus: (surveyId?: string) => ipcRenderer.invoke('survey:getStatus', surveyId),
    getQuestions: (surveyId?: string) => ipcRenderer.invoke('survey:getQuestions', surveyId),
    submit: (payload) => ipcRenderer.invoke('survey:submit', payload),
    getResponse: (surveyId?: string) => ipcRenderer.invoke('survey:getResponse', surveyId),
  },

  // Admin Survey Dashboard
  admin: {
    getAuthStatus: () => ipcRenderer.invoke('admin:getAuthStatus'),
    setupPassword: (password: string) => ipcRenderer.invoke('admin:setupPassword', password),
    login: (password: string) => ipcRenderer.invoke('admin:login', password),
    logout: () => ipcRenderer.invoke('admin:logout'),
    getStats: (token?: string) => ipcRenderer.invoke('admin:getStats', token),
    getResponses: (filters?: any, token?: string) => ipcRenderer.invoke('admin:getResponses', { filters, token }),
    exportData: (format: 'csv' | 'json' | 'summary', token?: string) => ipcRenderer.invoke('admin:exportData', { format, token }),
    importData: (token?: string) => ipcRenderer.invoke('admin:importData', token),
  },
};

contextBridge.exposeInMainWorld('api', api);
