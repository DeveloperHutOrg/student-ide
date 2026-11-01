import React from 'react';
import { 
  Code2, 
  Terminal, 
  Play, 
  FolderOpen, 
  FilePlus, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Globe, 
  Layers, 
  Clock, 
  BookOpen, 
  ArrowRight,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { StudentProfile, SupportedLanguageId, FileItem } from '@/common/types';

interface DashboardViewProps {
  profile: StudentProfile | null;
  files: FileItem[];
  onOpenFile: (file: FileItem) => void;
  onQuickStart: (language: SupportedLanguageId) => void;
  onOpenFolder: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onSwitchToEditor: () => void;
  activeFileName?: string;
}

interface LanguageCardData {
  id: SupportedLanguageId;
  name: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  available: boolean;
  notes: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  files,
  onOpenFile,
  onQuickStart,
  onOpenFolder,
  onOpenSettings,
  onOpenAbout,
  onSwitchToEditor,
  activeFileName,
}) => {
  const studentName = profile?.student_name || 'Student';
  const studentClass = profile?.student_class || 8;

  const languagesList: LanguageCardData[] = [
    {
      id: 'python',
      name: 'Python',
      tagline: 'High-level, beginner-friendly language for scripts, math and automation.',
      badge: 'Auto-Detected',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: <Code2 className="w-6 h-6 text-yellow-400" />,
      available: true,
      notes: 'Standard school syllabus curriculum'
    },
    {
      id: 'cpp',
      name: 'C++ (C++17)',
      tagline: 'High-performance compiled language for algorithms and competitive coding.',
      badge: 'Bundled GCC 14',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      icon: <Cpu className="w-6 h-6 text-rose-400" />,
      available: true,
      notes: 'MinGW-w64 toolchain bundled'
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      tagline: 'Modern programming language powering interactive applications and web logic.',
      badge: 'Built-in Node.js',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      icon: <Layers className="w-6 h-6 text-amber-300" />,
      available: true,
      notes: 'Node.js v24 offline engine'
    },
    {
      id: 'html',
      name: 'HTML5',
      tagline: 'HyperText Markup Language to build structural web pages and forms.',
      badge: 'Live Preview',
      badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      icon: <Globe className="w-6 h-6 text-orange-400" />,
      available: true,
      notes: 'Sandboxed browser iframe'
    },
    {
      id: 'css',
      name: 'CSS3',
      tagline: 'Cascading Style Sheets to style, animate, and beautify web layouts.',
      badge: 'Live Preview',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      icon: <Globe className="w-6 h-6 text-sky-400" />,
      available: true,
      notes: 'Live design view'
    },
    {
      id: 'sql',
      name: 'SQL',
      tagline: 'Structured Query Language to create and manipulate relational databases.',
      badge: 'Built-in SQLite',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      icon: <Database className="w-6 h-6 text-purple-400" />,
      available: true,
      notes: 'Embedded SQLite 3 engine'
    },
    {
      id: 'php',
      name: 'PHP',
      tagline: 'Server-side web scripting language. Editor syntax highlighted.',
      badge: 'External Runtime',
      badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      icon: <Terminal className="w-6 h-6 text-indigo-300" />,
      available: false,
      notes: 'Requires local PHP interpreter'
    }
  ];

  const recentFiles = files.filter(f => !f.isDirectory).slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0F19] text-[#F8FAFC] p-6 sm:p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

        {/* 1. Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                INDIA'S FIRST STUDENT-FRIENDLY OFFLINE IDE
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, <span className="text-brand-gradient">{studentName}</span>!
              </h1>

              <div className="flex items-center gap-3 mt-1 text-sm text-[#94A3B8]">
                <span className="bg-[#1E293B] border border-[#334155] px-2.5 py-0.5 rounded-full text-xs font-medium text-[#CBD5E1]">
                  Class {studentClass} Student
                </span>
                <span>•</span>
                <span className="italic text-[#CBD5E1]">"Your ideas deserve a place to become real. Start coding today!"</span>
              </div>
            </div>

            {/* Resume / Continue CTA */}
            <div className="flex items-center gap-3 shrink-0">
              {activeFileName ? (
                <button
                  onClick={onSwitchToEditor}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume {activeFileName}</span>
                </button>
              ) : (
                <button
                  onClick={() => onQuickStart(studentClass <= 8 ? 'html' : 'python')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start New Program</span>
                </button>
              )}

              <button
                onClick={onOpenFolder}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#CBD5E1] font-medium text-xs transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Open Folder</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Quick Start Bar */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
            <FilePlus className="w-4 h-4 text-[#818CF8]" />
            Quick Start (1-Click Template)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onQuickStart('python')}
              className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-yellow-500/40 hover:bg-[#1E293B] flex items-center gap-3 transition-all text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">Python Script</span>
                <span className="text-[11px] text-[#64748B]">main.py</span>
              </div>
            </button>

            <button
              onClick={() => onQuickStart('cpp')}
              className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-rose-500/40 hover:bg-[#1E293B] flex items-center gap-3 transition-all text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">C++ Program</span>
                <span className="text-[11px] text-[#64748B]">program.cpp (C++17)</span>
              </div>
            </button>

            <button
              onClick={() => onQuickStart('html')}
              className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-cyan-500/40 hover:bg-[#1E293B] flex items-center gap-3 transition-all text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">Web Page</span>
                <span className="text-[11px] text-[#64748B]">index.html</span>
              </div>
            </button>

            <button
              onClick={() => onQuickStart('sql')}
              className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-purple-500/40 hover:bg-[#1E293B] flex items-center gap-3 transition-all text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">SQL Query</span>
                <span className="text-[11px] text-[#64748B]">database.sql</span>
              </div>
            </button>
          </div>
        </div>

        {/* 3. Available Programming Languages Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#818CF8]" />
              Available Programming Languages
            </h2>
            <span className="text-xs text-[#64748B]">Tailored for school syllabus</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {languagesList.map((lang) => (
              <div
                key={lang.id}
                className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] hover:border-[#334155] transition-all flex flex-col justify-between space-y-4 relative group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center">
                      {lang.icon}
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${lang.badgeColor}`}>
                      {lang.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{lang.name}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-2">{lang.tagline}</p>
                  <p className="text-[11px] text-[#64748B] font-mono">• {lang.notes}</p>
                </div>

                <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between">
                  {lang.available ? (
                    <button
                      onClick={() => onQuickStart(lang.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1E293B] hover:bg-indigo-600 text-xs font-semibold text-[#CBD5E1] hover:text-white transition-all cursor-pointer"
                    >
                      <span>Start Coding</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onQuickStart(lang.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1E293B]/60 text-xs font-medium text-[#64748B] hover:text-[#94A3B8] transition-colors cursor-pointer"
                      title="Syntax highlighting enabled; runtime requires local installation"
                    >
                      <span>Open Editor (Syntax Highlight)</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Split Section: Recent Files & Grade Level Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Files */}
          <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#38BDF8]" />
              Recent Project Files
            </h3>

            {recentFiles.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                No files in current project folder. Click Quick Start above to create your first file.
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => {
                      onOpenFile(file);
                      onSwitchToEditor();
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#0B0F19] hover:bg-[#1E293B] border border-transparent hover:border-[#334155] flex items-center justify-between transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Code2 className="w-4 h-4 text-[#818CF8] shrink-0" />
                      <span className="text-xs font-mono text-[#E2E8F0] truncate">{file.name}</span>
                    </div>
                    <span className="text-[11px] text-[#64748B] shrink-0">Open</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* School Curriculum Recommendations */}
          <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#A855F7]" />
              Recommended Curriculum Pathways
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-start gap-3">
                <span className="font-bold text-[#38BDF8] shrink-0">Classes 6–8:</span>
                <span className="text-[#94A3B8]">Foundations in Web (HTML5 & CSS3) and introductory Python algorithms.</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-start gap-3">
                <span className="font-bold text-[#818CF8] shrink-0">Classes 9–10:</span>
                <span className="text-[#94A3B8]">Structured Python programming, standard input handling, relational SQL queries.</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-start gap-3">
                <span className="font-bold text-[#A855F7] shrink-0">Classes 11–12:</span>
                <span className="text-[#94A3B8]">C++17 object-oriented programming, data structures, and advanced database modeling.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Student IDE Core Advantages */}
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Built for Students • 100% Offline Integrity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#94A3B8]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Zero Cloud Dependency</strong>
                <span>All code, files, and profiles stay securely on your computer disk in local SQLite.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Bundled Compilers</strong>
                <span>Comes with MinGW-w64 GCC 14 and Node.js pre-installed without downloading extras.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Interactive Console</strong>
                <span>Full support for standard input prompts (<code>std::cin</code> & <code>input()</code>).</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Footer Branding Banner */}
        <div className="pt-4 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">STUDENT IDE</span>
            <span>•</span>
            <span>Learn. Code. Build.</span>
            <span>•</span>
            <span>Proudly Built in India 🇮🇳</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAbout}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About the Platform
            </button>
            <button
              onClick={onOpenSettings}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Settings & Profile
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
