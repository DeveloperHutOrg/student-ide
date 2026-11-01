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
  studentProfileId: number;
  studentName: string;
  studentClass: number;
  answers: SurveyAnswers;
  submittedAt: string;
  status: string;
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
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
