import React, { useRef } from 'react';
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
  onCursorChange?: (line: number, column: number) => void;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  language,
  fileName,
  fontSize = 14,
  onSave,
  onRun,
  onCursorChange,
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

    // Track cursor movements for status bar
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] overflow-hidden relative">
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
    </div>
  );
};
