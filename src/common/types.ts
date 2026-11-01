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

// Survey Module Types
export type SurveyQuestionType = 'single_choice' | 'multiple_choice' | 'text';

export interface SurveyQuestion {
  id: string;
  questionNumber: number;
  text: string;
  type: SurveyQuestionType;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface SurveyDefinition {
  id: string;
  title: string;
  version: string;
  description: string;
  isActive: boolean;
  questions: SurveyQuestion[];
}

export interface SurveyStatus {
  hasSubmitted: boolean;
  submittedAt?: string;
  surveyId: string;
  surveyTitle: string;
  surveyVersion: string;
  studentProfile: {
    id: number;
    name: string;
    studentClass: number;
  } | null;
}

export interface SurveyAnswers {
  q1: string;
  q2: string;
  q3: string;
  q4: string | string[];
  q5: string | string[];
  q6?: string;
  [key: string]: any;
}

export interface SubmitSurveyPayload {
  surveyId: string;
  answers: SurveyAnswers;
}

export interface SurveySubmitResult {
  success: boolean;
  submittedAt: string;
  responseId: number;
  message?: string;
}

export interface SurveyResponseRecord {
  id: number;
  surveyId: string;
  studentProfileId?: number | null;
  studentName: string;
  studentClass: number;
  answers: SurveyAnswers;
  submittedAt: string;
  status: string;
  sourceType?: 'local' | 'imported';
  externalResponseId?: string;
}

// Admin Survey Dashboard Types
export interface AdminAuthStatus {
  isConfigured: boolean;
  isAuthenticated: boolean;
}

export interface AdminResponseItem {
  id: number;
  surveyId: string;
  surveyTitle?: string;
  surveyVersion?: string;
  studentProfileId?: number | null;
  studentName: string;
  studentClass: number;
  answers: SurveyAnswers;
  submittedAt: string;
  status: string;
  sourceType: 'local' | 'imported';
  externalResponseId?: string;
}

export interface AdminSurveyStats {
  totalResponses: number;
  localResponses: number;
  importedResponses: number;
  currentComputerSubmitted: boolean;
  classDistribution: Record<number, number>;
  questionStats: {
    q1: Record<string, number>;
    q2: Record<string, number>;
    q3: Record<string, number>;
    q4: Record<string, number>;
    q5: Record<string, number>;
  };
  latestSubmissions: AdminResponseItem[];
}

export interface AdminFilterOptions {
  studentClass?: number | 'all';
  surveyVersion?: string | 'all';
  sourceType?: 'all' | 'local' | 'imported';
  searchQuery?: string;
  sortBy?: 'newest' | 'oldest';
}

export interface ImportSurveyResult {
  success: boolean;
  totalInFile: number;
  importedCount: number;
  skippedDuplicates: number;
  rejectedCount: number;
  details: string[];
}

export interface ExportBackupRecord {
  responseId: string | number;
  surveyId: string;
  surveyVersion: string;
  studentName: string;
  studentClass: number;
  answers: SurveyAnswers;
  submittedAt: string;
  source: 'local' | 'imported';
}

export interface ExportBackupFormat {
  exportFormatVersion: '1.0.0';
  exportedAt: string;
  generator: string;
  totalRecords: number;
  surveyId: string;
  surveyVersion: string;
  records: ExportBackupRecord[];
}

export interface PublicSessionInfo {
  isAuthenticated: boolean;
  student?: StudentProfile;
  loginTime?: number;
}

export interface ElectronAPI {
  // Profile
  getProfile: () => Promise<StudentProfile | null>;
  saveProfile: (name: string, studentClass: number) => Promise<StudentProfile>;
  
  // Session & Logout
  session: {
    getStatus: () => Promise<PublicSessionInfo>;
    login: (params?: { studentId?: number; name?: string; studentClass?: number }) => Promise<{ success: boolean; session: PublicSessionInfo }>;
    logout: () => Promise<{ success: boolean }>;
  };

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
  sendStdin: (input: string) => Promise<boolean>;
  
  // Streaming execution events
  onExecutionOutput: (callback: (output: ExecutionOutput) => void) => () => void;
  onExecutionComplete: (callback: (result: ExecutionResult) => void) => () => void;

  // App Utilities & Onboarding
  isOnboardingCompleted: () => Promise<boolean>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  openExternalUrl: (url: string) => Promise<void>;

  // Survey Module
  getSurveyStatus: (surveyId?: string) => Promise<SurveyStatus>;
  getSurveyQuestions: (surveyId?: string) => Promise<SurveyDefinition>;
  submitSurvey: (payload: SubmitSurveyPayload) => Promise<SurveySubmitResult>;
  getSurveyResponse: (surveyId?: string) => Promise<SurveyResponseRecord | null>;
  survey?: {
    getStatus: (surveyId?: string) => Promise<SurveyStatus>;
    getQuestions: (surveyId?: string) => Promise<SurveyDefinition>;
    submit: (payload: SubmitSurveyPayload) => Promise<SurveySubmitResult>;
    getResponse: (surveyId?: string) => Promise<SurveyResponseRecord | null>;
  };

  // Admin Survey Dashboard
  admin?: {
    getAuthStatus: () => Promise<AdminAuthStatus>;
    setupPassword: (password: string) => Promise<{ success: boolean; token?: string; error?: string }>;
    login: (password: string) => Promise<{ success: boolean; token?: string; error?: string }>;
    logout: () => Promise<void>;
    getStats: (token?: string) => Promise<AdminSurveyStats>;
    getResponses: (filters?: AdminFilterOptions, token?: string) => Promise<AdminResponseItem[]>;
    exportData: (format: 'csv' | 'json' | 'summary', token?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
    importData: (token?: string) => Promise<ImportSurveyResult>;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
