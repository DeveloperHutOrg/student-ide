export type SupportedLanguageId = 
  | 'html'
  | 'css'
  | 'python'
  | 'javascript'
  | 'sql'
  | 'cpp'
  | 'php';

export interface StudentProfile {
  id?: number;
  student_name: string;
  student_class: number; // 6 to 12
  created_at?: string;
  updated_at?: string;
}

export interface LanguagePreference {
  id: SupportedLanguageId;
  name: string;
  extension: string;
  category: 'web' | 'programming' | 'database';
  enabled: boolean;
  isSuggested: boolean;
  monacoLanguage: string;
  description: string;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  extension?: string;
  children?: FileItem[];
}

export interface ActiveFile {
  path: string;
  name: string;
  content: string;
  language: SupportedLanguageId;
  isDirty: boolean;
}

export type OutputType = 'stdout' | 'stderr' | 'info' | 'error' | 'success';

export interface ExecutionOutput {
  type: OutputType;
  text: string;
  timestamp: number;
}

export interface ExecutionResult {
  exitCode: number | null;
  durationMs: number;
  status: 'completed' | 'error' | 'stopped' | 'timeout';
  error?: string;
}

export interface SqlQueryResult {
  columns: string[];
  rows: any[][];
  changes?: number;
  executionTimeMs: number;
}

export interface AppSettings {
  fontSize: number;
  theme: 'vs-dark' | 'light';
  autoSave: boolean;
}

export interface ElectronAPI {
  // Profile
  getProfile: () => Promise<StudentProfile | null>;
  saveProfile: (name: string, studentClass: number) => Promise<StudentProfile>;
  
  // Languages
  getLanguagePreferences: () => Promise<LanguagePreference[]>;
  saveLanguagePreferences: (enabledIds: SupportedLanguageId[]) => Promise<void>;
  
  // File operations
  getDefaultProjectsDir: () => Promise<string>;
  readDirectory: (dirPath: string) => Promise<FileItem[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  createFile: (parentDir: string, fileName: string, initialContent?: string) => Promise<string>;
  createDirectory: (parentDir: string, dirName: string) => Promise<string>;
  deletePath: (targetPath: string) => Promise<boolean>;
  selectDirectory: () => Promise<string | null>;
  
  // Execution
  runCode: (params: {
    language: SupportedLanguageId;
    code: string;
    filePath?: string;
    projectDir?: string;
  }) => Promise<{ executionId: string; success: boolean }>;
  stopExecution: () => Promise<void>;
  
  // Streaming execution events
  onExecutionOutput: (callback: (output: ExecutionOutput) => void) => () => void;
  onExecutionComplete: (callback: (result: ExecutionResult) => void) => () => void;

  // App Utilities & Onboarding
  isOnboardingCompleted: () => Promise<boolean>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  openExternalUrl: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
