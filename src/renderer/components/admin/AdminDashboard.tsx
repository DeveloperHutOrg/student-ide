import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Download, 
  Upload, 
  BarChart3, 
  Table, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  School, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  RefreshCw, 
  X, 
  ArrowLeft,
  Loader2,
  HardDriveDownload,
  Info,
  Users
} from 'lucide-react';
import { 
  AdminSurveyStats, 
  AdminResponseItem, 
  AdminFilterOptions, 
  ImportSurveyResult 
} from '@/common/types';

interface AdminDashboardProps {
  token: string;
  onClose: () => void;
  onLogout: () => void;
}

type AdminTab = 'analytics' | 'responses' | 'transfer';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onClose,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminSurveyStats | null>(null);
  const [responses, setResponses] = useState<AdminResponseItem[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<AdminResponseItem | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<number | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'local' | 'imported'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Operation notifications & import feedback
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importResult, setImportResult] = useState<ImportSurveyResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Load stats and responses
  const loadData = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      if (window.api?.admin) {
        const [statsData, responsesData] = await Promise.all([
          window.api.admin.getStats(token),
          window.api.admin.getResponses({}, token),
        ]);
        setStats(statsData);
        setResponses(responsesData);
      }
    } catch (err: any) {
      console.error('[AdminDashboard] Load error:', err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to load survey data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Filtered responses calculation
  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      // Class filter
      if (classFilter !== 'all' && r.studentClass !== classFilter) return false;
      // Source filter
      if (sourceFilter !== 'all' && r.sourceType !== sourceFilter) return false;
      // Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = r.studentName.toLowerCase().includes(query);
        const classMatch = `class ${r.studentClass}`.includes(query);
        if (!nameMatch && !classMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.submittedAt.replace(' ', 'T')).getTime();
      const dateB = new Date(b.submittedAt.replace(' ', 'T')).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [responses, classFilter, sourceFilter, searchQuery, sortOrder]);

  // Export handlers
  const handleExport = async (format: 'csv' | 'json' | 'summary') => {
    if (!window.api?.admin) return;
    setIsExporting(true);
    setActionMessage(null);
    try {
      const res = await window.api.admin.exportData(format, token);
      if (res.success && res.filePath) {
        setActionMessage({
          type: 'success',
          text: `Successfully exported ${format.toUpperCase()} to: ${res.filePath}`,
        });
      } else if (!res.canceled) {
        setActionMessage({
          type: 'error',
          text: res.error || `Failed to export ${format.toUpperCase()}.`,
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Export error.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Import handler
  const handleImport = async () => {
    if (!window.api?.admin) return;
    setIsImporting(true);
    setActionMessage(null);
    setImportResult(null);
    try {
      const res = await window.api.admin.importData(token);
      if (res.success) {
        setImportResult(res);
        setActionMessage({
          type: 'success',
          text: `Import completed! Imported ${res.importedCount} new record(s), skipped ${res.skippedDuplicates} duplicate(s).`,
        });
        await loadData();
      } else if (res.details && res.details.length > 0 && res.details[0] !== 'Import cancelled.') {
        setImportResult(res);
        setActionMessage({ type: 'error', text: res.details[0] });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Import error.' });
    } finally {
      setIsImporting(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      if (window.api?.admin) {
        await window.api.admin.logout();
      }
    } finally {
      onLogout();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e2e] text-[#cdd6f4] overflow-hidden select-none">
      {/* Top Admin Header Bar */}
      <header className="h-14 bg-[#181825] border-b border-[#313244] px-5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#89b4fa]/15 border border-[#89b4fa]/30 text-[#89b4fa]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">Admin Survey Dashboard</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/30">
                Offline Mode
              </span>
            </div>
            <p className="text-[11px] text-[#a6adc8]">
              Multi-installation survey analytics, response database, and import/export center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh database records"
            className="p-1.5 rounded-lg bg-[#11111b] border border-[#313244] text-[#a6adc8] hover:text-white hover:border-[#89b4fa] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Lock & Logout */}
          <button
            onClick={handleLogout}
            title="Lock admin session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11111b] border border-[#313244] text-xs font-medium text-[#f38ba8] hover:bg-[#f38ba8]/15 hover:border-[#f38ba8] transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>

          <div className="h-4 w-px bg-[#313244]" />

          {/* Exit to IDE */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] text-xs font-semibold shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Dashboard</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="bg-[#11111b] border-b border-[#313244] px-5 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-[#313244] text-white shadow-sm'
                : 'text-[#a6adc8] hover:text-white hover:bg-[#181825]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#89b4fa]" />
            <span>Overview & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('responses')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'responses'
                ? 'bg-[#313244] text-white shadow-sm'
                : 'text-[#a6adc8] hover:text-white hover:bg-[#181825]'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-[#cba6f7]" />
            <span>Individual Responses ({filteredResponses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transfer')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'transfer'
                ? 'bg-[#313244] text-white shadow-sm'
                : 'text-[#a6adc8] hover:text-white hover:bg-[#181825]'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-[#a6e3a1]" />
            <span>Import & Export Center</span>
          </button>
        </div>

        {/* Global Action Banner */}
        {actionMessage && (
          <div className={`px-3 py-1 rounded-lg text-xs flex items-center gap-2 animate-in fade-in ${
            actionMessage.type === 'success' 
              ? 'bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/30' 
              : 'bg-[#f38ba8]/15 text-[#f38ba8] border border-[#f38ba8]/30'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{actionMessage.text}</span>
          </div>
        )}
      </div>

      {/* Main Tab View Container */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && !stats ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#cdd6f4]">
            <Loader2 className="w-8 h-8 text-[#89b4fa] animate-spin mb-3" />
            <p className="text-xs text-[#a6adc8]">Compiling survey analytics from SQLite...</p>
          </div>
        ) : (
          <>
            {/* Top KPI Cards (Always visible) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#181825] border border-[#313244] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#a6adc8] mb-1.5">
                  <span>Total Submissions</span>
                  <Table className="w-4 h-4 text-[#89b4fa]" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {stats?.totalResponses || 0}
                </div>
                <div className="text-[11px] text-[#6c7086] mt-1">
                  Total survey submissions recorded
                </div>
              </div>

              <div className="bg-[#181825] border border-[#313244] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#a6adc8] mb-1.5">
                  <span>Participating Students</span>
                  <Users className="w-4 h-4 text-[#fab387]" />
                </div>
                <div className="text-2xl font-bold text-[#fab387] tracking-tight">
                  {stats?.uniqueStudents || stats?.totalResponses || 0}
                </div>
                <div className="text-[11px] text-[#6c7086] mt-1">
                  Unique participating students
                </div>
              </div>

              <div className="bg-[#181825] border border-[#313244] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#a6adc8] mb-1.5">
                  <span>Local PC Submissions</span>
                  <User className="w-4 h-4 text-[#a6e3a1]" />
                </div>
                <div className="text-2xl font-bold text-[#a6e3a1] tracking-tight flex items-center gap-2">
                  <span>{stats?.localResponses || 0}</span>
                  {stats?.currentComputerSubmitted && (
                    <CheckCircle2 className="w-5 h-5 text-[#a6e3a1]" title="Local submissions recorded on this PC" />
                  )}
                </div>
                <div className="text-[11px] text-[#6c7086] mt-1">
                  Submitted directly on this computer
                </div>
              </div>

              <div className="bg-[#181825] border border-[#313244] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-[#a6adc8] mb-1.5">
                  <span>Imported Responses</span>
                  <Upload className="w-4 h-4 text-[#cba6f7]" />
                </div>
                <div className="text-2xl font-bold text-[#cba6f7] tracking-tight">
                  {stats?.importedResponses || 0}
                </div>
                <div className="text-[11px] text-[#6c7086] mt-1">
                  Transferred from other lab computers
                </div>
              </div>
            </div>

            {/* TAB 1: ANALYTICS & OVERVIEW */}
            {activeTab === 'analytics' && stats && (
              <div className="space-y-6">
                {/* Class Distribution Breakdown */}
                <div className="bg-[#181825] border border-[#313244] rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <School className="w-4 h-4 text-[#89b4fa]" />
                      <span>Responses by Student Class (Classes 6–12)</span>
                    </h2>
                    <span className="text-xs text-[#a6adc8]">{stats.totalResponses} total</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[6, 7, 8, 9, 10, 11, 12].map((cls) => {
                      const count = stats.classDistribution[cls] || 0;
                      const pct = stats.totalResponses > 0 
                        ? Math.round((count / stats.totalResponses) * 100) 
                        : 0;
                      return (
                        <div key={cls} className="bg-[#11111b] border border-[#313244]/60 rounded-xl p-3 text-center">
                          <span className="text-xs font-semibold text-[#89b4fa] block mb-1">
                            Class {cls}
                          </span>
                          <span className="text-xl font-bold text-white block">
                            {count}
                          </span>
                          <span className="text-[10px] text-[#6c7086] block mt-0.5">
                            {pct}% of total
                          </span>
                          {/* Mini Progress Bar */}
                          <div className="w-full bg-[#313244] h-1 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="bg-[#89b4fa] h-full rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Question Distributions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Q1: Ease of Use */}
                  <div className="bg-[#181825] border border-[#313244] rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#89b4fa]/20 text-[#89b4fa] text-[10px]">Q1</span>
                      <span>How easy is Student IDE to use?</span>
                    </h3>
                    <div className="space-y-2">
                      {['Very Easy', 'Easy', 'Average', 'Difficult', 'Very Difficult'].map((opt) => {
                        const count = stats.questionStats.q1[opt] || 0;
                        const pct = stats.totalResponses > 0 ? Math.round((count / stats.totalResponses) * 100) : 0;
                        return (
                          <div key={opt} className="text-xs">
                            <div className="flex justify-between mb-1">
                              <span className="text-[#cdd6f4]">{opt}</span>
                              <span className="text-[#a6adc8] font-medium">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-[#11111b] h-2 rounded-full overflow-hidden border border-[#313244]/40">
                              <div className="bg-[#a6e3a1] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Q2: Primary Programming Language */}
                  <div className="bg-[#181825] border border-[#313244] rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#89b4fa]/20 text-[#89b4fa] text-[10px]">Q2</span>
                      <span>Primary Programming Language</span>
                    </h3>
                    <div className="space-y-2">
                      {['Python', 'C++', 'JavaScript', 'HTML and CSS', 'SQL', 'PHP'].map((opt) => {
                        const count = stats.questionStats.q2[opt] || 0;
                        const pct = stats.totalResponses > 0 ? Math.round((count / stats.totalResponses) * 100) : 0;
                        return (
                          <div key={opt} className="text-xs">
                            <div className="flex justify-between mb-1">
                              <span className="text-[#cdd6f4]">{opt}</span>
                              <span className="text-[#a6adc8] font-medium">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-[#11111b] h-2 rounded-full overflow-hidden border border-[#313244]/40">
                              <div className="bg-[#89b4fa] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Q3: Usage Frequency */}
                  <div className="bg-[#181825] border border-[#313244] rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#89b4fa]/20 text-[#89b4fa] text-[10px]">Q3</span>
                      <span>Usage Frequency</span>
                    </h3>
                    <div className="space-y-2">
                      {['Daily', 'Several times a week', 'Once a week', 'Occasionally'].map((opt) => {
                        const count = stats.questionStats.q3[opt] || 0;
                        const pct = stats.totalResponses > 0 ? Math.round((count / stats.totalResponses) * 100) : 0;
                        return (
                          <div key={opt} className="text-xs">
                            <div className="flex justify-between mb-1">
                              <span className="text-[#cdd6f4]">{opt}</span>
                              <span className="text-[#a6adc8] font-medium">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-[#11111b] h-2 rounded-full overflow-hidden border border-[#313244]/40">
                              <div className="bg-[#f9e2af] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Q4: Most Useful Features (Votes) */}
                  <div className="bg-[#181825] border border-[#313244] rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#89b4fa]/20 text-[#89b4fa] text-[10px]">Q4</span>
                      <span>Most Useful Features (Multi-Vote)</span>
                    </h3>
                    <div className="space-y-2">
                      {['Code Editor', 'File Explorer', 'Code Execution', 'Output Terminal', 'Live Web Preview'].map((opt) => {
                        const count = stats.questionStats.q4[opt] || 0;
                        return (
                          <div key={opt} className="text-xs flex items-center justify-between p-2 rounded-lg bg-[#11111b] border border-[#313244]/40">
                            <span className="text-[#cdd6f4]">{opt}</span>
                            <span className="px-2 py-0.5 rounded bg-[#89b4fa]/15 text-[#89b4fa] font-semibold text-[11px]">
                              {count} votes
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Q5: Desired Improvements */}
                <div className="bg-[#181825] border border-[#313244] rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#cba6f7]/20 text-[#cba6f7] text-[10px]">Q5</span>
                    <span>Top Requested Improvements</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {['Tutorials', 'More programming languages', 'Coding exercises', 'Better error explanations', 'More project examples'].map((opt) => {
                      const count = stats.questionStats.q5[opt] || 0;
                      return (
                        <div key={opt} className="bg-[#11111b] border border-[#313244]/60 rounded-xl p-3">
                          <span className="text-xs text-[#cdd6f4] block font-medium mb-1 truncate" title={opt}>
                            {opt}
                          </span>
                          <span className="text-lg font-bold text-[#cba6f7]">
                            {count} <span className="text-[10px] text-[#6c7086] font-normal">votes</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INDIVIDUAL RESPONSES TABLE */}
            {activeTab === 'responses' && (
              <div className="space-y-4">
                {/* Search & Filter Toolbar */}
                <div className="bg-[#181825] border border-[#313244] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
                  {/* Search by Name */}
                  <div className="relative min-w-[240px] flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by student name or class..."
                      className="w-full bg-[#11111b] border border-[#313244] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-[#6c7086] focus:outline-none focus:border-[#89b4fa]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#6c7086] absolute left-3 top-2.5" />
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-2">
                    {/* Class Filter */}
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="bg-[#11111b] border border-[#313244] rounded-xl px-2.5 py-1.5 text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                    >
                      <option value="all">All Classes</option>
                      {[6, 7, 8, 9, 10, 11, 12].map((c) => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>

                    {/* Source Filter */}
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value as any)}
                      className="bg-[#11111b] border border-[#313244] rounded-xl px-2.5 py-1.5 text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                    >
                      <option value="all">All Sources</option>
                      <option value="local">Local PC Only</option>
                      <option value="imported">Imported Only</option>
                    </select>

                    {/* Sort Order */}
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="bg-[#11111b] border border-[#313244] rounded-xl px-2.5 py-1.5 text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>

                {/* Responses Table */}
                <div className="bg-[#181825] border border-[#313244] rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#11111b] border-b border-[#313244] text-[#a6adc8]">
                        <th className="py-3 px-4 font-semibold">ID</th>
                        <th className="py-3 px-4 font-semibold">Student Name</th>
                        <th className="py-3 px-4 font-semibold">Class</th>
                        <th className="py-3 px-4 font-semibold">Source</th>
                        <th className="py-3 px-4 font-semibold">Primary Language</th>
                        <th className="py-3 px-4 font-semibold">Submitted Date</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#313244]/50">
                      {filteredResponses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-[#a6adc8]">
                            No survey responses match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredResponses.map((r) => (
                          <tr key={r.id} className="hover:bg-[#11111b]/40 transition-colors">
                            <td className="py-3 px-4 text-[#6c7086] font-mono">#{r.id}</td>
                            <td className="py-3 px-4 font-medium text-white">{r.studentName}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-[#313244] text-[#cdd6f4] text-[11px] font-medium">
                                Class {r.studentClass}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                r.sourceType === 'local' 
                                  ? 'bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/30' 
                                  : 'bg-[#cba6f7]/15 text-[#cba6f7] border border-[#cba6f7]/30'
                              }`}>
                                {r.sourceType.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#89b4fa] font-medium">{r.answers?.q2 || '—'}</td>
                            <td className="py-3 px-4 text-[#a6adc8]">
                              {r.submittedAt.slice(0, 16)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedResponse(r)}
                                className="px-2.5 py-1 rounded-lg bg-[#11111b] border border-[#313244] hover:bg-[#89b4fa] hover:text-[#11111b] text-xs text-[#cdd6f4] transition-all inline-flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: IMPORT & EXPORT CENTER */}
            {activeTab === 'transfer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-[#181825] border border-[#313244] rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-[#89b4fa]/15 border border-[#89b4fa]/30 text-[#89b4fa]">
                        <Download className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Export Survey Records</h2>
                        <p className="text-xs text-[#a6adc8]">
                          Save responses as CSV for Excel or versioned JSON backup
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <button
                        onClick={() => handleExport('csv')}
                        disabled={isExporting}
                        className="w-full p-3 rounded-xl bg-[#11111b] border border-[#313244] hover:border-[#89b4fa] hover:bg-[#181825] text-left transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="w-5 h-5 text-[#a6e3a1]" />
                          <div>
                            <span className="text-xs font-bold text-white block">Export CSV (Excel UTF-8)</span>
                            <span className="text-[11px] text-[#6c7086] block">
                              Includes UTF-8 BOM, response IDs, student details, and all 6 questions
                            </span>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-[#6c7086] group-hover:text-white transition-colors" />
                      </button>

                      <button
                        onClick={() => handleExport('json')}
                        disabled={isExporting}
                        className="w-full p-3 rounded-xl bg-[#11111b] border border-[#313244] hover:border-[#89b4fa] hover:bg-[#181825] text-left transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <FileCode className="w-5 h-5 text-[#89b4fa]" />
                          <div>
                            <span className="text-xs font-bold text-white block">Export Versioned JSON Backup</span>
                            <span className="text-[11px] text-[#6c7086] block">
                              Standard backup format for importing into teacher workstation
                            </span>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-[#6c7086] group-hover:text-white transition-colors" />
                      </button>

                      <button
                        onClick={() => handleExport('summary')}
                        disabled={isExporting}
                        className="w-full p-3 rounded-xl bg-[#11111b] border border-[#313244] hover:border-[#89b4fa] hover:bg-[#181825] text-left transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-[#cba6f7]" />
                          <div>
                            <span className="text-xs font-bold text-white block">Export Aggregated Summary (TXT)</span>
                            <span className="text-[11px] text-[#6c7086] block">
                              Class-by-class percentages and statistical vote counts
                            </span>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-[#6c7086] group-hover:text-white transition-colors" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#6c7086]">
                    🔒 Exports are generated locally on demand. Files are saved directly to your chosen folder.
                  </p>
                </div>

                {/* Import Card */}
                <div className="bg-[#181825] border border-[#313244] rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-[#cba6f7]/15 border border-[#cba6f7]/30 text-[#cba6f7]">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Import from Other Installations</h2>
                        <p className="text-xs text-[#a6adc8]">
                          Collect responses from other student laptops via USB/JSON
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#11111b] border border-[#313244] rounded-xl p-4 mb-5 text-xs text-[#a6adc8] space-y-2">
                      <div className="flex items-center gap-2 font-medium text-white">
                        <Info className="w-4 h-4 text-[#89b4fa]" />
                        <span>Offline Import Guarantees:</span>
                      </div>
                      <p>✓ <strong>Schema Validation:</strong> Verified with Zod before database insertion.</p>
                      <p>✓ <strong>Duplicate Detection:</strong> Exact response hash check skips already imported students.</p>
                      <p>✓ <strong>Atomic Transactions:</strong> All records commit together; rolls back on corrupt data.</p>
                      <p>✓ <strong>Zero Overwrite:</strong> Existing local responses are never replaced silently.</p>
                    </div>

                    <button
                      onClick={handleImport}
                      disabled={isImporting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#cba6f7] to-[#b4befe] hover:from-[#b4befe] hover:to-[#89b4fa] text-[#11111b] font-semibold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing Import File...</span>
                        </>
                      ) : (
                        <>
                          <HardDriveDownload className="w-4 h-4" />
                          <span>Select JSON Backup File to Import</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Import Results Box (if available) */}
                  {importResult && (
                    <div className="mt-4 p-3 rounded-xl bg-[#11111b] border border-[#313244] text-xs">
                      <span className="font-semibold text-white block mb-1">Last Import Summary:</span>
                      <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-[#313244]">
                        <div>
                          <span className="text-[#a6e3a1] font-bold block text-sm">{importResult.importedCount}</span>
                          <span className="text-[10px] text-[#6c7086]">Imported</span>
                        </div>
                        <div>
                          <span className="text-[#f9e2af] font-bold block text-sm">{importResult.skippedDuplicates}</span>
                          <span className="text-[10px] text-[#6c7086]">Skipped Duplicates</span>
                        </div>
                        <div>
                          <span className="text-[#f38ba8] font-bold block text-sm">{importResult.rejectedCount}</span>
                          <span className="text-[10px] text-[#6c7086]">Rejected</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* INDIVIDUAL RESPONSE MODAL */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div 
            className="w-full max-w-2xl bg-[#181825] border border-[#313244] rounded-2xl shadow-2xl p-6 relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#313244] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#89b4fa]/15 text-[#89b4fa]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedResponse.studentName} — Class {selectedResponse.studentClass}
                  </h3>
                  <p className="text-[11px] text-[#a6adc8]">
                    Record #{selectedResponse.id} • {selectedResponse.sourceType.toUpperCase()} • Submitted: {selectedResponse.submittedAt}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedResponse(null)}
                className="p-1.5 rounded-lg text-[#a6adc8] hover:text-white hover:bg-[#313244] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Answer Body */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              <div className="p-3 rounded-xl bg-[#11111b] border border-[#313244]/50">
                <span className="text-[#a6adc8] block font-medium mb-1">1. How easy is Student IDE to use?</span>
                <span className="text-sm font-semibold text-[#89b4fa]">{selectedResponse.answers?.q1 || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#11111b] border border-[#313244]/50">
                <span className="text-[#a6adc8] block font-medium mb-1">2. Primary programming language:</span>
                <span className="text-sm font-semibold text-[#89b4fa]">{selectedResponse.answers?.q2 || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#11111b] border border-[#313244]/50">
                <span className="text-[#a6adc8] block font-medium mb-1">3. Usage frequency:</span>
                <span className="text-sm font-semibold text-[#89b4fa]">{selectedResponse.answers?.q3 || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#11111b] border border-[#313244]/50">
                <span className="text-[#a6adc8] block font-medium mb-1">4. Most useful features:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Array.isArray(selectedResponse.answers?.q4) ? (
                    selectedResponse.answers.q4.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#89b4fa]/15 text-[#89b4fa] font-medium">
                        {f}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#89b4fa] font-semibold">{selectedResponse.answers?.q4 || '—'}</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#11111b] border border-[#313244]/50">
                <span className="text-[#a6adc8] block font-medium mb-1">5. Desired improvements:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Array.isArray(selectedResponse.answers?.q5) ? (
                    selectedResponse.answers.q5.map((imp, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#cba6f7]/15 text-[#cba6f7] font-medium">
                        {imp}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#cba6f7] font-semibold">{selectedResponse.answers?.q5 || '—'}</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#11111b] border border-[#313244]/50">
                <span className="text-[#a6adc8] block font-medium mb-1">6. Additional suggestions:</span>
                <p className="text-[#cdd6f4] italic whitespace-pre-wrap">
                  {selectedResponse.answers?.q6 ? `"${selectedResponse.answers.q6}"` : 'None provided.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#313244] flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[#11111b] hover:bg-[#313244] border border-[#313244] text-[#cdd6f4] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
