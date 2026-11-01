import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FilePlus, 
  FolderPlus, 
  RefreshCw, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Globe,
  Database,
  Cpu,
  Code2
} from 'lucide-react';
import { FileItem, SupportedLanguageId } from '@/common/types';
import { STARTER_TEMPLATES } from '@/common/languages';
import { BrandLogo } from '../common/BrandLogo';

interface SidebarProps {
  projectDir: string;
  files: FileItem[];
  activeFilePath?: string;
  onFileSelect: (file: FileItem) => void;
  onRefresh: () => void;
  onSelectProjectDir: () => void;
  onCreateFile: (fileName: string, initialContent?: string) => Promise<void>;
  onCreateFolder: (folderName: string) => Promise<void>;
  onDeleteFile: (filePath: string) => Promise<void>;
  enabledLanguages: SupportedLanguageId[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  projectDir,
  files,
  activeFilePath,
  onFileSelect,
  onRefresh,
  onSelectProjectDir,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  enabledLanguages,
}) => {
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedExt, setSelectedExt] = useState<string>('.py');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let name = newFileName.trim();
    if (!name) return;

    // Append extension if not already typed
    if (!name.includes('.')) {
      name += selectedExt;
    }

    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    let initialCode = '';
    if (ext === '.html') initialCode = STARTER_TEMPLATES.html;
    else if (ext === '.css') initialCode = STARTER_TEMPLATES.css;
    else if (ext === '.py') initialCode = STARTER_TEMPLATES.python;
    else if (ext === '.js') initialCode = STARTER_TEMPLATES.javascript;
    else if (ext === '.sql') initialCode = STARTER_TEMPLATES.sql;
    else if (ext === '.cpp') initialCode = STARTER_TEMPLATES.cpp;
    else if (ext === '.php') initialCode = STARTER_TEMPLATES.php;

    await onCreateFile(name, initialCode);
    setNewFileName('');
    setIsCreatingFile(false);
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    await onCreateFolder(name);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    switch (ext) {
      case '.html':
        return <Globe className="w-4 h-4 text-[#89dceb]" />;
      case '.css':
        return <Globe className="w-4 h-4 text-[#74c7ec]" />;
      case '.py':
        return <Code2 className="w-4 h-4 text-[#f9e2af]" />;
      case '.js':
        return <Code2 className="w-4 h-4 text-[#a6e3a1]" />;
      case '.sql':
        return <Database className="w-4 h-4 text-[#fab387]" />;
      case '.cpp':
        return <Cpu className="w-4 h-4 text-[#f38ba8]" />;
      case '.php':
        return <Code2 className="w-4 h-4 text-[#cba6f7]" />;
      default:
        return <File className="w-4 h-4 text-[#a6adc8]" />;
    }
  };

  const folderBaseName = projectDir ? projectDir.split(/[\\/]/).pop() : 'Projects';

  return (
    <aside className="w-60 bg-[#181825] border-r border-[#313244] flex flex-col h-full select-none shrink-0">
      {/* Workspace Header */}
      <div className="p-2.5 px-3 border-b border-[#313244] flex items-center justify-between bg-[#11111b]/30">
        <div 
          onClick={onSelectProjectDir}
          title={`Folder: ${projectDir}\nClick to change folder`}
          className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors overflow-hidden"
        >
          <BrandLogo size={18} className="shrink-0" />
          <span className="font-semibold text-xs text-[#cdd6f4] truncate">
            {folderBaseName}
          </span>
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsCreatingFile(true);
              setIsCreatingFolder(false);
            }}
            title="New File"
            className="p-1 rounded hover:bg-[#313244] text-[#a6adc8] hover:text-white transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsCreatingFolder(true);
              setIsCreatingFile(false);
            }}
            title="New Folder"
            className="p-1 rounded hover:bg-[#313244] text-[#a6adc8] hover:text-white transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRefresh}
            title="Refresh Files"
            className="p-1 rounded hover:bg-[#313244] text-[#a6adc8] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline File Creator */}
      {isCreatingFile && (
        <form onSubmit={handleCreateFileSubmit} className="p-2 bg-[#11111b] border-b border-[#313244] space-y-1.5">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename"
              autoFocus
              className="flex-1 px-2 py-1 bg-[#181825] border border-[#313244] rounded text-xs text-white focus:outline-none focus:border-[#89b4fa]"
            />
            <select
              value={selectedExt}
              onChange={(e) => setSelectedExt(e.target.value)}
              className="bg-[#181825] border border-[#313244] rounded text-xs text-[#a6adc8] px-1 py-1 focus:outline-none"
            >
              <option value=".py">.py</option>
              <option value=".html">.html</option>
              <option value=".css">.css</option>
              <option value=".js">.js</option>
              <option value=".sql">.sql</option>
              <option value=".cpp">.cpp</option>
              <option value=".php">.php</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="px-2 py-0.5 text-[11px] text-[#a6adc8] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-0.5 bg-[#89b4fa] text-[#11111b] rounded text-[11px] font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Inline Folder Creator */}
      {isCreatingFolder && (
        <form onSubmit={handleCreateFolderSubmit} className="p-2 bg-[#11111b] border-b border-[#313244] space-y-1.5">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="folder name"
            autoFocus
            className="w-full px-2 py-1 bg-[#181825] border border-[#313244] rounded text-xs text-white focus:outline-none focus:border-[#89b4fa]"
          />
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="px-2 py-0.5 text-[11px] text-[#a6adc8] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-0.5 bg-[#89b4fa] text-[#11111b] rounded text-[11px] font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#6c7086]">
            <p>No files yet.</p>
            <p className="mt-1">Click the + icon above to create your first code file!</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {files.map((file) => {
              const isActive = activeFilePath === file.path;
              return (
                <div
                  key={file.path}
                  onClick={() => !file.isDirectory && onFileSelect(file)}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#313244] text-white font-medium'
                      : 'text-[#cdd6f4] hover:bg-[#1e1e2e] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {file.isDirectory ? (
                      <Folder className="w-4 h-4 text-[#89b4fa] shrink-0" />
                    ) : (
                      getFileIcon(file.name)
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>

                  {/* Delete file button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                        onDeleteFile(file.path);
                      }
                    }}
                    title="Delete"
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-[#f38ba8] transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick starter templates shortcut footer */}
      <div className="p-2 border-t border-[#313244] bg-[#11111b]/40">
        <span className="text-[10px] text-[#6c7086] uppercase tracking-wider block mb-1">
          Quick Starters
        </span>
        <div className="flex flex-wrap gap-1">
          {enabledLanguages.slice(0, 4).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                const ext = `.${lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang}`;
                onCreateFile(`example_${lang}${ext}`, STARTER_TEMPLATES[lang]);
              }}
              className="text-[10px] bg-[#181825] hover:bg-[#313244] border border-[#313244] text-[#a6adc8] hover:text-white px-2 py-0.5 rounded transition-colors"
            >
              +{lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
