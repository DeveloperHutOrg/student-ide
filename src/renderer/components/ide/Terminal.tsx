import React, { useRef, useEffect, useState } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2,
  CornerDownLeft,
  X
} from 'lucide-react';
import { ExecutionOutput, ExecutionResult } from '@/common/types';

interface TerminalProps {
  outputs: ExecutionOutput[];
  lastResult: ExecutionResult | null;
  isRunning: boolean;
  onClear: () => void;
  onClose?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  outputs,
  lastResult,
  isRunning,
  onClear,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [outputs]);

  const copyToClipboard = () => {
    const fullText = outputs.map((o) => o.text).join('');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOutputColor = (type: ExecutionOutput['type']) => {
    switch (type) {
      case 'stdout': return 'text-[#E2E8F0]';
      case 'stderr': return 'text-rose-400 font-medium';
      case 'error': return 'text-rose-400 font-semibold';
      case 'success': return 'text-emerald-400 font-semibold';
      case 'info': return 'text-cyan-300 font-medium';
      default: return 'text-[#CBD5E1]';
    }
  };

  const handleSendInput = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue) return;
    try {
      await window.api.sendStdin(inputValue + '\n');
      setInputValue('');
    } catch (err) {
      console.error('Failed to send stdin:', err);
    }
  };

  return (
    <div className="h-56 bg-[#0B0F19] border-t border-[#1E293B] flex flex-col select-none shrink-0 font-mono">
      {/* Terminal Header */}
      <div className="h-8 bg-[#0F172A] px-3 flex items-center justify-between border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-white">Console Output</span>

          {/* Running Badge */}
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Running...
            </span>
          )}

          {/* Completed / Error Badge */}
          {!isRunning && lastResult && (
            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              lastResult.status === 'completed'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : lastResult.status === 'stopped'
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}>
              {lastResult.status === 'completed' ? (
                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-3 h-3 stroke-[2.5]" />
              )}
              {lastResult.status === 'completed' ? 'Exit Code 0' : `Status: ${lastResult.status}`}
              <span className="text-[#64748B] ml-1">({lastResult.durationMs}ms)</span>
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={copyToClipboard}
            title="Copy Output"
            className="p-1 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            title="Clear Console"
            className="p-1 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Console Panel"
              className="p-1 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div
        ref={containerRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-xs select-text whitespace-pre-wrap leading-relaxed bg-[#0B0F19]"
      >
        {outputs.length === 0 ? (
          <div className="text-[#475569] italic font-sans text-xs">
            Program output and compiler logs appear here. Press <strong className="text-[#94A3B8] font-mono">Run (F5)</strong> to execute code.
          </div>
        ) : (
          outputs.map((item, idx) => (
            <span key={idx} className={getOutputColor(item.type)}>
              {item.text}
            </span>
          ))
        )}
      </div>

      {/* Interactive Stdin Bar (Active when program is running) */}
      {isRunning && (
        <form
          onSubmit={handleSendInput}
          className="h-8 bg-[#0F172A] px-3 flex items-center gap-2 border-t border-[#1E293B] animate-fade-in"
        >
          <span className="text-indigo-400 font-mono text-xs select-none font-bold">&gt;</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type input for program (cin / input) and press Enter..."
            className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder:text-[#64748B]"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-2.5 py-0.5 text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
          >
            <span>Send</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      )}
    </div>
  );
};
