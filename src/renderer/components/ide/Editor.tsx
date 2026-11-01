import React, { useRef, useEffect } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { SupportedLanguageId } from '@/common/types';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language: SupportedLanguageId;
  fileName?: string;
  fontSize?: number;
  onSave?: () => void;
  onRun?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  language,
  fileName,
  fontSize = 14,
  onSave,
  onRun,
}) => {
  const editorRef = useRef<any>(null);

  // Map supported language ID to Monaco's language identifier
  const getMonacoLanguage = (lang: SupportedLanguageId): string => {
    switch (lang) {
      case 'python': return 'python';
      case 'javascript': return 'javascript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'sql': return 'sql';
      case 'cpp': return 'cpp';
      case 'php': return 'php';
      default: return 'plaintext';
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Ctrl+S save shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) onSave();
    });

    // Register F5 run shortcut
    editor.addCommand(monaco.KeyCode.F5, () => {
      if (onRun) onRun();
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e2e] overflow-hidden relative">
      {/* Monaco Editor Container */}
      <div className="flex-1 w-full h-full">
        <MonacoEditor
          height="100%"
          language={getMonacoLanguage(language)}
          value={value}
          theme="vs-dark"
          onChange={(val) => onChange(val ?? '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
            minimap: { enabled: false }, // Cleaner, distraction-free for students
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderWhitespace: 'selection',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Editor Footer Status Bar */}
      <div className="h-6 bg-[#181825] border-t border-[#313244] px-3 flex items-center justify-between text-[11px] text-[#a6adc8] select-none shrink-0">
        <div className="flex items-center gap-3">
          <span>{fileName || 'Untitled'}</span>
          <span>•</span>
          <span className="uppercase text-[#89b4fa] font-mono">{language}</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>UTF-8</span>
          <span>Spaces: 4</span>
          <span className="text-[#6c7086]">Ctrl+S Save | F5 Run</span>
        </div>
      </div>
    </div>
  );
};
