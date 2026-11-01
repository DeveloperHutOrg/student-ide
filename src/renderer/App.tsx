import React, { useState, useEffect, useCallback } from 'react';
import { 
  StudentProfile, 
  LanguagePreference, 
  SupportedLanguageId, 
  FileItem, 
  ActiveFile, 
  ExecutionOutput, 
  ExecutionResult 
} from '@/common/types';
import { STARTER_TEMPLATES } from '@/common/languages';
import { ProfileSetup } from './components/onboarding/ProfileSetup';
import { LanguageSelection } from './components/onboarding/LanguageSelection';
import { Navbar } from './components/ide/Navbar';
import { Sidebar } from './components/ide/Sidebar';
import { Editor } from './components/ide/Editor';
import { Terminal } from './components/ide/Terminal';
import { WebPreview } from './components/ide/WebPreview';
import { SettingsModal } from './components/ide/SettingsModal';
import { AboutModal } from './components/about/AboutModal';
import { SurveyView } from './components/survey/SurveyView';

type AppStep = 'loading' | 'onboarding_profile' | 'onboarding_languages' | 'ide';

export const App: React.FC = () => {
  // Navigation & Profile State
  const [step, setStep] = useState<AppStep>('loading');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [pendingProfile, setPendingProfile] = useState<{ name: string; studentClass: number } | null>(null);
  const [languages, setLanguages] = useState<LanguagePreference[]>([]);

  // Navigation View: Editor vs Survey
  const [activeView, setActiveView] = useState<'editor' | 'survey'>('editor');
  const [surveyCompleted, setSurveyCompleted] = useState<boolean>(false);

  // Workspace & File State
  const [projectDir, setProjectDir] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);

  // Execution & Terminal State
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutputs, setTerminalOutputs] = useState<ExecutionOutput[]>([]);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);

  // Layout & Modals State
  const [showPreview, setShowPreview] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  // Determine enabled languages
  const enabledLanguages: SupportedLanguageId[] = languages
    .filter((l) => l.enabled)
    .map((l) => l.id);

  // 1. Initial Application Load - Checks SQLite for persistent profile & onboarding status
  useEffect(() => {
    async function loadInitialData() {
      try {
        if (!window.api) {
          console.warn('Electron API not found (running in standard browser)');
          setStep('onboarding_profile');
          return;
        }

        // Fetch saved profile and onboarding status from local SQLite database
        const savedProfile = await window.api.getProfile();
        const onboardingDone = await window.api.isOnboardingCompleted();

        // Check survey completion status to restore green tick if previously submitted
        if (window.api.getSurveyStatus) {
          window.api.getSurveyStatus()
            .then((surveyStatus) => {
              if (surveyStatus && surveyStatus.hasSubmitted) {
                setSurveyCompleted(true);
              }
            })
            .catch((err) => console.warn('[App] Failed to check survey status:', err));
        }

        if (savedProfile && savedProfile.student_name && savedProfile.student_name.trim().length > 0) {
          // Profile exists! Set profile in state
          setProfile(savedProfile);
          const prefs = await window.api.getLanguagePreferences();
          setLanguages(prefs);

          // If onboarding is already completed, skip both profile setup and language selection
          if (onboardingDone) {
            setStep('ide');
            // Asynchronously load workspace files without blocking IDE entry
            window.api.getDefaultProjectsDir()
              .then((defaultDir) => {
                setProjectDir(defaultDir);
                return loadWorkspaceFiles(defaultDir, savedProfile.student_class);
              })
              .catch((wsErr) => {
                console.warn('Workspace load warning:', wsErr);
              });
            return;
          }

          // Profile exists but language selection not completed yet: continue to Step 2
          setPendingProfile({ name: savedProfile.student_name, studentClass: savedProfile.student_class });
          setStep('onboarding_languages');
          return;
        }

        // Fresh launch - no profile found in SQLite
        setStep('onboarding_profile');
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setStep('onboarding_profile');
      }
    }

    loadInitialData();
  }, []);

  // 2. Stream execution events
  useEffect(() => {
    if (!window.api) return;

    const unbindOutput = window.api.onExecutionOutput((output) => {
      setTerminalOutputs((prev) => [...prev, output]);
    });

    const unbindComplete = window.api.onExecutionComplete((result) => {
      setIsRunning(false);
      setLastResult(result);
    });

    return () => {
      unbindOutput();
      unbindComplete();
    };
  }, []);

  // Helper to load files in workspace
  const loadWorkspaceFiles = async (dir: string, studentClass: number) => {
    if (!window.api) return;
    try {
      const fileList = await window.api.readDirectory(dir);
      setFiles(fileList);

      // If workspace is completely empty, create an initial starter file
      if (fileList.length === 0) {
        const initialLang: SupportedLanguageId = studentClass <= 8 ? 'html' : 'python';
        const initialExt = initialLang === 'html' ? '.html' : '.py';
        const initialName = initialLang === 'html' ? 'index.html' : 'main.py';
        const initialContent = STARTER_TEMPLATES[initialLang];

        const createdPath = await window.api.createFile(dir, initialName, initialContent);
        const updatedList = await window.api.readDirectory(dir);
        setFiles(updatedList);

        setActiveFile({
          path: createdPath,
          name: initialName,
          content: initialContent,
          language: initialLang,
          isDirty: false,
        });

        if (initialLang === 'html') {
          setShowPreview(true);
        }
      } else if (!activeFile && fileList.length > 0) {
        const firstFile = fileList.find((f) => !f.isDirectory) || fileList[0];
        if (!firstFile.isDirectory) {
          await handleFileSelect(firstFile);
        }
      }
    } catch (err) {
      console.warn('Failed reading workspace directory:', err);
    }
  };

  // Helper to deduce language from file extension
  const getLanguageFromPath = (filePath: string): SupportedLanguageId => {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    switch (ext) {
      case '.html': return 'html';
      case '.css': return 'css';
      case '.py': return 'python';
      case '.js': return 'javascript';
      case '.sql': return 'sql';
      case '.cpp': return 'cpp';
      case '.php': return 'php';
      default: return 'python';
    }
  };

  // File Select Handler
  const handleFileSelect = async (file: FileItem) => {
    if (!window.api || file.isDirectory) return;
    try {
      const content = await window.api.readFile(file.path);
      const language = getLanguageFromPath(file.path);

      setActiveFile({
        path: file.path,
        name: file.name,
        content,
        language,
        isDirty: false,
      });

      if (language === 'html' || language === 'css') {
        setShowPreview(true);
      }
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  };

  // File Save Handler
  const handleSaveFile = useCallback(async () => {
    if (!window.api || !activeFile) return;
    try {
      await window.api.writeFile(activeFile.path, activeFile.content);
      setActiveFile((prev) => (prev ? { ...prev, isDirty: false } : null));
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [activeFile]);

  // Run Code Handler
  const handleRunCode = useCallback(async () => {
    if (!window.api || !activeFile || isRunning) return;

    if (activeFile.isDirty) {
      await handleSaveFile();
    }

    setShowTerminal(true);
    setTerminalOutputs([]);
    setLastResult(null);
    setIsRunning(true);

    if (activeFile.language === 'html' || activeFile.language === 'css') {
      setShowPreview(true);
    }

    try {
      await window.api.runCode({
        language: activeFile.language,
        code: activeFile.content,
        filePath: activeFile.path,
        projectDir,
      });
    } catch (err: any) {
      setIsRunning(false);
      setTerminalOutputs((prev) => [
        ...prev,
        { type: 'error', text: `Execution failed: ${err.message}\n`, timestamp: Date.now() },
      ]);
    }
  }, [activeFile, isRunning, handleSaveFile, projectDir]);

  // Stop Code Handler
  const handleStopCode = async () => {
    if (!window.api || !isRunning) return;
    await window.api.stopExecution();
  };

  // Create File Handler
  const handleCreateFile = async (fileName: string, initialContent?: string) => {
    if (!window.api || !projectDir) return;
    const newPath = await window.api.createFile(projectDir, fileName, initialContent || '');
    const updatedList = await window.api.readDirectory(projectDir);
    setFiles(updatedList);

    const lang = getLanguageFromPath(newPath);
    setActiveFile({
      path: newPath,
      name: fileName,
      content: initialContent || '',
      language: lang,
      isDirty: false,
    });

    if (lang === 'html' || lang === 'css') {
      setShowPreview(true);
    }
  };

  // Create Folder Handler
  const handleCreateFolder = async (folderName: string) => {
    if (!window.api || !projectDir) return;
    await window.api.createDirectory(projectDir, folderName);
    const updatedList = await window.api.readDirectory(projectDir);
    setFiles(updatedList);
  };

  // Delete File Handler
  const handleDeleteFile = async (filePath: string) => {
    if (!window.api || !projectDir) return;
    await window.api.deletePath(filePath);
    const updatedList = await window.api.readDirectory(projectDir);
    setFiles(updatedList);

    if (activeFile?.path === filePath) {
      const remaining = updatedList.filter((f) => !f.isDirectory);
      if (remaining.length > 0) {
        handleFileSelect(remaining[0]);
      } else {
        setActiveFile(null);
      }
    }
  };

  // Select Folder Handler
  const handleSelectFolder = async () => {
    if (!window.api) return;
    const chosen = await window.api.selectDirectory();
    if (chosen) {
      setProjectDir(chosen);
      const studentClass = profile ? profile.student_class : 8;
      await loadWorkspaceFiles(chosen, studentClass);
    }
  };

  // Onboarding Step 1: Profile Submit - Saves profile permanently to local SQLite!
  const handleProfileSubmit = async (name: string, studentClass: number) => {
    try {
      if (!window.api) return;
      const saved = await window.api.saveProfile(name, studentClass);
      setProfile(saved);
      setPendingProfile({ name: saved.student_name, studentClass: saved.student_class });

      // Check if language preferences are already set
      const onboardingDone = await window.api.isOnboardingCompleted();
      if (onboardingDone) {
        setStep('ide');
        const defaultDir = await window.api.getDefaultProjectsDir();
        setProjectDir(defaultDir);
        await loadWorkspaceFiles(defaultDir, saved.student_class);
        return;
      }

      // Proceed to Step 2: Language Selection
      const prefs = await window.api.getLanguagePreferences();
      setLanguages(prefs);
      setStep('onboarding_languages');
    } catch (err) {
      console.error('Failed to save profile during onboarding:', err);
    }
  };

  // Onboarding Step 2: Language Selection Submit - Marks onboarding complete and launches IDE
  const handleLanguagesSubmit = async (enabledLanguageIds: SupportedLanguageId[]) => {
    try {
      if (!window.api) return;

      if (!profile && pendingProfile) {
        const saved = await window.api.saveProfile(pendingProfile.name, pendingProfile.studentClass);
        setProfile(saved);
      }

      // Save language preferences to SQLite and mark onboarding complete
      await window.api.saveLanguagePreferences(enabledLanguageIds);
      await window.api.setOnboardingCompleted(true);

      const updatedPrefs = await window.api.getLanguagePreferences();
      setLanguages(updatedPrefs);

      // Transition to main IDE directly
      setStep('ide');

      const currentClass = profile ? profile.student_class : (pendingProfile?.studentClass || 8);
      const defaultDir = await window.api.getDefaultProjectsDir();
      setProjectDir(defaultDir);
      await loadWorkspaceFiles(defaultDir, currentClass);
    } catch (err) {
      console.error('Failed to complete language selection:', err);
      setStep('ide');
    }
  };

  // Settings: Edit Profile - Updates SQLite and stays inside IDE
  const handleSettingsSaveProfile = async (name: string, studentClass: number) => {
    try {
      if (!window.api) return;
      const updated = await window.api.saveProfile(name, studentClass);
      setProfile(updated);
      await window.api.setOnboardingCompleted(true);
      const updatedPrefs = await window.api.getLanguagePreferences();
      setLanguages(updatedPrefs);
    } catch (err) {
      console.error('Failed to update profile from settings:', err);
    }
  };

  // Settings: Save Languages
  const handleSettingsSaveLanguages = async (enabledIds: SupportedLanguageId[]) => {
    try {
      if (!window.api) return;
      await window.api.saveLanguagePreferences(enabledIds);
      await window.api.setOnboardingCompleted(true);
      const updatedPrefs = await window.api.getLanguagePreferences();
      setLanguages(updatedPrefs);
    } catch (err) {
      console.error('Failed to update language preferences from settings:', err);
    }
  };

  // Render Loading
  if (step === 'loading') {
    return (
      <div className="h-screen w-screen bg-[#1e1e2e] flex items-center justify-center text-white select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#89b4fa] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-[#cdd6f4]">Starting Student IDE...</span>
        </div>
      </div>
    );
  }

  // Render Onboarding: Step 1 Profile Setup
  if (step === 'onboarding_profile') {
    return (
      <ProfileSetup
        initialName=""
        initialClass={8}
        onComplete={handleProfileSubmit}
      />
    );
  }

  // Render Onboarding: Step 2 Language Selection
  if (step === 'onboarding_languages' && (pendingProfile || profile)) {
    const studentName = profile?.student_name || pendingProfile?.name || 'Student';
    const studentClass = profile?.student_class || pendingProfile?.studentClass || 8;
    return (
      <LanguageSelection
        studentName={studentName}
        studentClass={studentClass}
        initialPreferences={languages}
        onComplete={handleLanguagesSubmit}
        onBack={() => setStep('onboarding_profile')}
      />
    );
  }

  // Render Main IDE Workspace
  return (
    <div className="h-screen w-screen bg-[#1e1e2e] flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        profile={profile}
        activeLanguage={activeFile ? activeFile.language : 'python'}
        onLanguageChange={(lang) => {
          if (activeFile) {
            setActiveFile({ ...activeFile, language: lang });
          }
        }}
        availableLanguages={enabledLanguages.length > 0 ? enabledLanguages : ['python', 'html']}
        isRunning={isRunning}
        onRun={handleRunCode}
        onStop={handleStopCode}
        onSave={handleSaveFile}
        isDirty={activeFile?.isDirty || false}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
        activeFileName={activeFile?.name}
        activeView={activeView}
        onViewChange={setActiveView}
        isSurveyCompleted={surveyCompleted}
      />

      {/* Main View: Survey View OR Code Editor Workspace */}
      {activeView === 'survey' ? (
        <SurveyView
          onBackToEditor={() => setActiveView('editor')}
          onSurveySubmitted={() => setSurveyCompleted(true)}
        />
      ) : (
        /* Main IDE Workspace */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            projectDir={projectDir}
            files={files}
            activeFilePath={activeFile?.path}
            onFileSelect={handleFileSelect}
            onRefresh={() => projectDir && profile && loadWorkspaceFiles(projectDir, profile.student_class)}
            onSelectProjectDir={handleSelectFolder}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeleteFile={handleDeleteFile}
            enabledLanguages={enabledLanguages}
          />

          {/* Center / Right Split Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor and Web Preview Split */}
            <div className="flex-1 flex overflow-hidden">
              {activeFile ? (
                <Editor
                  value={activeFile.content}
                  onChange={(newVal) => {
                    setActiveFile((prev) =>
                      prev ? { ...prev, content: newVal, isDirty: true } : null
                    );
                  }}
                  language={activeFile.language}
                  fileName={activeFile.name}
                  fontSize={fontSize}
                  onSave={handleSaveFile}
                  onRun={handleRunCode}
                />
              ) : (
                <div className="flex-1 bg-[#1e1e2e] flex items-center justify-center text-[#6c7086] text-sm select-none">
                  <div className="text-center">
                    <p className="text-base text-[#a6adc8] font-medium mb-1">No file open</p>
                    <p className="text-xs">Select a file from the explorer on the left or create a new one.</p>
                  </div>
                </div>
              )}

              {/* Optional Side-by-side Web Preview for HTML/CSS */}
              {showPreview && (
                <WebPreview
                  htmlContent={
                    activeFile?.language === 'html'
                      ? activeFile.content
                      : '<!DOCTYPE html><html><body><h2 style="font-family:sans-serif">Student IDE Preview</h2></body></html>'
                  }
                  cssContent={activeFile?.language === 'css' ? activeFile.content : undefined}
                  onClose={() => setShowPreview(false)}
                />
              )}
            </div>

            {/* Bottom Output Terminal */}
            {showTerminal && (
              <Terminal
                outputs={terminalOutputs}
                lastResult={lastResult}
                isRunning={isRunning}
                onClear={() => {
                  setTerminalOutputs([]);
                  setLastResult(null);
                }}
                onClose={() => setShowTerminal(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Settings & Profile Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleSettingsSaveProfile}
        languages={languages}
        onSaveLanguages={handleSettingsSaveLanguages}
        fontSize={fontSize}
        onFontSizeChange={(size) => setFontSize(size)}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {/* About the Founder & Student IDE Modal */}
      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        defaultTab="founder"
      />
    </div>
  );
};

export default App;
