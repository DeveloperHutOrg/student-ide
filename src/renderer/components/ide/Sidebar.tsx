import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FilePlus, 
  FolderPlus, 
  RefreshCw, 
  Trash2, 
  Globe, 
  Database, 
  Cpu, 
  Code2,
  Terminal,
  Layers,
  Settings,
  ClipboardList,
  Sparkles
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
  onOpenSettings?: () => void;
  onOpenSurvey?: () => void;
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
  onOpenSettings,
  onOpenSurvey,
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
        return <Globe className="w-4 h-4 text-orange-400" />;
      case '.css':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case '.py':
        return <Code2 className="w-4 h-4 text-yellow-400" />;
      case '.js':
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case '.sql':
        return <Database className="w-4 h-4 text-purple-400" />;
      case '.cpp':
        return <Cpu className="w-4 h-4 text-rose-400" />;
      case '.php':
        return <Terminal className="w-4 h-4 text-indigo-400" />;
      default:
        return <File className="w-4 h-4 text-[#94A3B8]" />;
    }
  };

  const folderBaseName = projectDir ? projectDir.split(/[\\/]/).pop() : 'Projects';

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-[#1E293B] flex flex-col h-full select-none shrink-0">
      {/* Workspace Header */}
      <div className="p-3 border-b border-[#1E293B] flex items-center justify-between bg-[#0B0F19]/40">
        <div 
          onClick={onSelectProjectDir}
          title={`Active Folder: ${projectDir}\nClick to choose another directory`}
          className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors overflow-hidden group"
        >
          <FolderOpen className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <span className="font-semibold text-xs text-[#E2E8F0] group-hover:text-white truncate">
            {folderBaseName}
          </span>
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {
              setIsCreatingFile(true);
              setIsCreatingFolder(false);
            }}
            title="New File"
            className="p-1 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsCreatingFolder(true);
              setIsCreatingFile(false);
            }}
            title="New Folder"
            className="p-1 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRefresh}
            title="Refresh Explorer"
            className="p-1 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline File Creator */}
      {isCreatingFile && (
        <form onSubmit={handleCreateFileSubmit} className="p-2.5 bg-[#0B0F19] border-b border-[#1E293B] space-y-2 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename"
              autoFocus
              className="flex-1 px-2.5 py-1 bg-[#1E293B] border border-[#334155] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <select
              value={selectedExt}
              onChange={(e) => setSelectedExt(e.target.value)}
              className="bg-[#1E293B] border border-[#334155] rounded-lg text-xs text-[#CBD5E1] px-1.5 py-1 focus:outline-none font-mono"
            >
              <option value=".py">.py</option>
              <option value=".cpp">.cpp</option>
              <option value=".html">.html</option>
              <option value=".css">.css</option>
              <option value=".js">.js</option>
              <option value=".sql">.sql</option>
              <option value=".php">.php</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="px-2 py-0.5 text-[11px] text-[#94A3B8] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Inline Folder Creator */}
      {isCreatingFolder && (
        <form onSubmit={handleCreateFolderSubmit} className="p-2.5 bg-[#0B0F19] border-b border-[#1E293B] space-y-2 animate-fade-in">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="folder name"
            autoFocus
            className="w-full px-2.5 py-1 bg-[#1E293B] border border-[#334155] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="px-2 py-0.5 text-[11px] text-[#94A3B8] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
          <span>Explorer Files</span>
          <span>{files.length}</span>
        </div>

        {files.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#64748B]">
            <p>No files in project.</p>
            <p className="mt-1">Click the + icon above to create your first code file.</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {files.map((file) => {
              const isActive = activeFilePath === file.path;
              return (
                <div
                  key={file.path}
                  onClick={() => !file.isDirectory && onFileSelect(file)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-white font-medium border border-indigo-500/30'
                      : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {file.isDirectory ? (
                      <Folder className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    ) : (
                      getFileIcon(file.name)
                    )}
                    <span className="truncate font-mono">{file.name}</span>
                  </div>

                  {/* Delete file button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${file.name}?`)) {
                        onDeleteFile(file.path);
                      }
                    }}
                    title="Delete File"
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition-opacity cursor-pointer"
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
      <div className="p-3 border-t border-[#1E293B] bg-[#0B0F19]/60">
        <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-bold block mb-1.5">
          Quick Starter Code
        </span>
        <div className="flex flex-wrap gap-1">
          {enabledLanguages.slice(0, 4).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                const ext = `.${lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang}`;
                onCreateFile(`starter_${lang}${ext}`, STARTER_TEMPLATES[lang]);
              }}
              className="text-[10px] bg-[#1E293B] hover:bg-indigo-600 border border-[#334155] text-[#CBD5E1] hover:text-white px-2 py-0.5 rounded-md transition-colors font-mono cursor-pointer"
            >
              +{lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
